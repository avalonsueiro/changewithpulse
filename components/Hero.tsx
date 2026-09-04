import Image from "next/image";
import Link from "next/link";

import WaitlistForm from "./WaitlistForm";

/**
 * Layout lives in app/globals.css rather than inline styles, because the frame
 * has to respond to the window's aspect ratio and its contents have to scale
 * with the frame — neither of which a style attribute can express.
 */
export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-frame">
        {/*
          muted + playsInline are both required for autoplay: without muted,
          Chrome and Safari block it outright; without playsInline, iOS Safari
          takes the video fullscreen instead of playing it in place.
        */}
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-poster.jpg"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        <div className="hero-scrim" aria-hidden="true" />

        <Image
          className="hero-logo"
          src="/pulse-logo.png"
          alt="Pulse"
          width={896}
          height={312}
          priority
        />

        <div className="hero-content">
          <h1 className="hero-title">Change is hard.</h1>
          <p className="hero-sub">
            Simulate how your organization will react to a rollout before you
            launch it, team by team and person by person.
          </p>
          <WaitlistForm />
        </div>
      </div>

      <footer className="hero-footer">
        <span>© {new Date().getFullYear()} Pulse</span>
        <span aria-hidden="true">·</span>
        <Link href="/privacy">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms">Terms</Link>
      </footer>
    </section>
  );
}
