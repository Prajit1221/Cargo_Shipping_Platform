import { AuctionList } from "@/components/AuctionList";

export default function AuctionPage() {
  return (
    <main className="container">
      <h2>Available Cargo Auctions</h2>
      <AuctionList />
      <section id="bidSection" style={{ display: "none" }}>
        <h3>Place Your Bid</h3>
        <form id="bidForm">
          <label htmlFor="bidAmount">Bid Amount:</label>
          <input type="number" id="bidAmount" name="bidAmount" required />
          <button type="submit">Place Bid</button>
        </form>
      </section>
      <section id="liveUpdates">
        <h3>Live Auction Updates</h3>
        {/* Live updates will be shown here */}
      </section>
      {/* Leaflet Map Modal - Placeholder for now */}
      <div id="mapModal" style={{ display: "none", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", zIndex: 2000, alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "90vw", maxWidth: "600px", height: "70vh", background: "#fff", borderRadius: "10px", overflow: "hidden" }}>
          <button id="closeMapModal" style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}>Close</button>
          <div id="map" style={{ width: "100%", height: "100%" }}></div>
          <div id="mapInfo" style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(255,255,255,0.9)", padding: "0.5rem 1rem", borderRadius: "6px", zIndex: 10 }}></div>
        </div>
      </div>
    </main>
  );
}
