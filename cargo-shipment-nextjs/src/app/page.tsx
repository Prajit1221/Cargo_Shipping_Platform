import Link from "next/link";
import "./home.css";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Your Trusted Partner in Cargo Shipping</h1>
          <p className="hero-subtitle">
            Connecting cargo owners with reliable truck owners for secure and
            efficient transportation.
          </p>
          <Link href="/signup" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="container">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon">1</div>
            <h3>List Your Cargo</h3>
            <p>
              Cargo owners can easily list their shipment details, including
              origin, destination, and weight.
            </p>
          </div>
          <div className="step">
            <div className="step-icon">2</div>
            <h3>Bid on Shipments</h3>
            <p>
              Truck owners can browse available shipments and place competitive
              bids in real-time auctions.
            </p>
          </div>
          <div className="step">
            <div className="step-icon">3</div>
            <h3>Secure & Track</h3>
            <p>
              Once a bid is accepted, the shipment is tracked in real-time,
              ensuring transparency and security.
            </p>
          </div>
        </div>
      </section>

      <section id="featured-auctions" className="container">
        <h2 className="section-title">Featured Auctions</h2>
        <div id="auction-list" className="auction-grid">
          {/* Featured auctions will be loaded here */}
        </div>
      </section>
    </main>
  );
}