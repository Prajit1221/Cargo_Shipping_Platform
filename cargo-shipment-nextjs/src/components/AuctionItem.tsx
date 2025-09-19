"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, Timestamp, addDoc, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapModal } from "./MapModal";

interface Cargo {
  id: string;
  ownerId: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  pickupDate: string;
  description: string;
  handlingInstructions?: string;
  auctionStart?: Timestamp;
  auctionEnd?: Timestamp;
  status?: string;
  winnerId?: string;
  winningAmount?: number;
}

interface AuctionItemProps {
  cargo: Cargo;
  currentUserId: string | null;
}

export function AuctionItem({ cargo, currentUserId }: AuctionItemProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [lowestBid, setLowestBid] = useState<number | null>(null);
  const [winnerInfo, setWinnerInfo] = useState<string | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [showMapModal, setShowMapModal] = useState(false);

  const getAuctionStatus = (currentCargo: Cargo) => {
    const now = new Date();
    const auctionStart = currentCargo.auctionStart?.toDate();
    const auctionEnd = currentCargo.auctionEnd?.toDate();

    if (auctionStart && now < auctionStart) {
      return { status: "not_started", class: "open" };
    } else if (auctionStart && auctionEnd && now >= auctionStart && now < auctionEnd) {
      return { status: "running", class: "running" };
    } else if (auctionEnd && now >= auctionEnd) {
      return { status: "ended", class: "closed" };
    } else {
      return { status: "unknown", class: "open" };
    }
  };

  const { status, class: statusClass } = getAuctionStatus(cargo);
  const isOwner = currentUserId === cargo.ownerId;

  // Timer Logic
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    const updateTimer = () => {
      const now = new Date();
      const auctionStart = cargo.auctionStart?.toDate();
      const auctionEnd = cargo.auctionEnd?.toDate();

      if (!auctionStart || !auctionEnd) {
        setTimeLeft("N/A");
        return;
      }

      if (now < auctionStart) {
        const diff = auctionStart.getTime() - now.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`<strong>Auction starts in:</strong> ${minutes}m ${seconds}s`);
      } else if (now >= auctionStart && now < auctionEnd) {
        const diff = auctionEnd.getTime() - now.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`<strong>Time left:</strong> ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft("<strong>Auction ended</strong>");
        clearInterval(timerInterval);
        // Optionally trigger closeAuctionAndSelectWinner here if not handled by Firestore trigger
      }
    };

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [cargo.auctionStart, cargo.auctionEnd]);

  // Lowest Bid Logic
  useEffect(() => {
    const bidsRef = collection(db, `cargos/${cargo.id}/bids`);
    const q = query(bidsRef, orderBy("amount", "asc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const bid = snapshot.docs[0].data();
        setLowestBid(bid.amount);
      } else {
        setLowestBid(null);
      }
    });

    return () => unsubscribe();
  }, [cargo.id]);

  // Winner Logic
  useEffect(() => {
    if (status === "ended" && cargo.winnerId) {
      setWinnerInfo(`<strong>Winner:</strong> <span style='color:#388e3c;'>${cargo.winnerId.slice(0, 6)}...</span> (₹${cargo.winningAmount})`);
    } else if (status === "ended" && !cargo.winnerId) {
      setWinnerInfo(`<strong>No bids placed. No winner.</strong>`);
    } else {
      setWinnerInfo(null);
    }
  }, [status, cargo.winnerId, cargo.winningAmount]);

  const handleStartAuction = async () => {
    const now = new Date();
    const auctionStart = now;
    const auctionEnd = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
    const cargoRef = doc(db, "cargos", cargo.id);
    await updateDoc(cargoRef, {
      auctionStart: Timestamp.fromDate(auctionStart),
      auctionEnd: Timestamp.fromDate(auctionEnd),
      status: "running", // Changed from 'open' to 'running' as per original logic
    });
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      alert("You must be logged in to place a bid.");
      return;
    }
    if (bidAmount === "" || Number(bidAmount) <= 0) {
      alert("Please enter a valid bid amount.");
      return;
    }

    try {
      const bidsRef = collection(db, `cargos/${cargo.id}/bids`);
      const existingBidQuery = query(bidsRef, where("userId", "==", currentUserId), limit(1));
      const existingBidSnapshot = await getDocs(existingBidQuery);

      if (!existingBidSnapshot.empty) {
        const bidDocId = existingBidSnapshot.docs[0].id;
        await updateDoc(doc(bidsRef, bidDocId), {
          amount: Number(bidAmount),
          createdAt: Timestamp.now(),
        });
      } else {
        await addDoc(bidsRef, {
          amount: Number(bidAmount),
          userId: currentUserId,
          createdAt: Timestamp.now(),
        });
      }
      alert("Bid placed successfully!");
      setShowBidForm(false);
      setBidAmount("");
    } catch (error: any) {
      alert("Failed to place bid: " + error.message);
    }
  };

  const handleViewRoute = () => {
    setShowMapModal(true);
  };

  return (
    <div key={cargo.id} className="auction-card">
      <span className={`status-badge ${statusClass}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
      <h4>
        {cargo.origin} → {cargo.destination}
      </h4>
      <div className="details-grid">
        <div className="detail-item">
          <strong>Type:</strong> <span>{cargo.cargoType}</span>
        </div>
        <div className="detail-item">
          <strong>Weight:</strong> <span>{cargo.weight} kg</span>
        </div>
        <div className="detail-item">
          <strong>Dimensions:</strong>
          <span>
            {cargo.dimensions ? `${cargo.dimensions.length}x${cargo.dimensions.width}x${cargo.dimensions.height} cm` : "N/A"}
          </span>
        </div>
        <div className="detail-item">
          <strong>Pickup:</strong> <span>{cargo.pickupDate}</span>
        </div>
      </div>
      <p><strong>Description:</strong> {cargo.description}</p>
      <p>
        <strong>Handling:</strong> {cargo.handlingInstructions || "N/A"}
      </p>
      <div className="bid-info">
        <div id={`auctionTimer-${cargo.id}`}>
          {timeLeft ? <span dangerouslySetInnerHTML={{ __html: timeLeft }} /> : <em>Loading timer...</em>}
        </div>
        <div id={`lowestBid-${cargo.id}`}>
          {lowestBid !== null ? (
            <><strong>Current Lowest Bid:</strong> ₹{lowestBid}</>
          ) : (
            <em>No bids yet</em>
          )}
        </div>
        <div id={`winner-${cargo.id}`}>
          {winnerInfo && <span dangerouslySetInnerHTML={{ __html: winnerInfo }} />}
        </div>
      </div>
      {isOwner && status === "not_started" && (
        <button onClick={handleStartAuction}>
          Start Auction
        </button>
      )}
      {!isOwner && status === "running" && (
        <button onClick={() => setShowBidForm(true)}>
          Bid
        </button>
      )}
      {showBidForm && !isOwner && status === "running" && (
        <form onSubmit={handlePlaceBid} className="bid-form mt-2">
          <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">Your Bid Amount:</label>
          <input
            type="number"
            id="bidAmount"
            name="bidAmount"
            min="1"
            required
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          <button type="submit" className="mt-2 btn btn-primary">Place Bid</button>
          <button type="button" onClick={() => setShowBidForm(false)} className="mt-2 ml-2 btn btn-secondary">Cancel</button>
        </form>
      )}
      {status === "not_started" && !isOwner && (
        <p><strong>Auction not started</strong></p>
      )}
      {status === "ended" && (
        <p><strong>Auction ended</strong></p>
      )}
      {isOwner && status !== "not_started" && (
        <p><strong>Your listing</strong></p>
      )}
      <button
        style={{ marginTop: "0.5rem" }}
        onClick={handleViewRoute}
      >
        View Route
      </button>

      {showMapModal && (
        <MapModal
          origin={cargo.origin}
          destination={cargo.destination}
          onClose={() => setShowMapModal(false)}
        />
      )}
    </div>
  );
}

