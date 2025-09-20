"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { AuctionItem } from "./AuctionItem";

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

export function AuctionList() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });

    const q = query(collection(db, "cargos"), orderBy("createdAt", "desc"));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const cargosData: Cargo[] = [];
      snapshot.forEach((doc) => {
        cargosData.push({ id: doc.id, ...doc.data() } as Cargo);
      });
      setCargos(cargosData);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  return (
    <section id="cargoList" className="auction-grid">
      {cargos.length === 0 ? (
        <p>No cargos available for auction.</p>
      ) : (
        cargos.map((cargo) => (
          <AuctionItem key={cargo.id} cargo={cargo} currentUserId={currentUserId} />
        ))
      )}
    </section>
  );
}
