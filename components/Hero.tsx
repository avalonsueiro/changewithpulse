import Image from "next/image";

import WaitlistForm from "./WaitlistForm";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(16px, 3vw, 32px)",
      }}
    >
      <div
        className="hero-frame"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1120,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid var(--line)",
          // The poster doubles as the container background, so the frame is
          // painted before the video has a single byte — and it is what
          // remains visible when reduced motion hides the video below.
          background: "#EFEEE9 url('/hero-poster.jpg') center / cover no-repeat",
        }}
      >
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
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15,15,13,0.14) 0%, rgba(15,15,13,0.42) 100%)",
          }}
        />

        <Image
          src="/pulse-logo.png"
          alt="Pulse"
          width={896}
          height={312}
          priority
          style={{
            position: "absolute",
            bottom: "clamp(20px, 3vw, 40px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "clamp(110px, 12vw, 150px)",
            height: "auto",
            // The source logo is dark-on-white; inverting and screen-blending
            // drops the white box out so it reads as light marks on the video.
            filter: "invert(1)",
            mixBlendMode: "screen",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(24px, 4vw, 64px)",
            // Extra bottom padding reserves the strip the logo sits in, so the
            // centred block clears it instead of colliding with the wordmark.
            paddingBottom: "clamp(88px, 11vw, 128px)",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-instrument-serif), serif",
              fontWeight: 400,
              fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.035em",
              color: "#FAFAF8",
              margin: "0 0 clamp(16px, 2vw, 28px)",
              textShadow: "0 2px 24px rgba(15,15,13,0.28)",
            }}
          >
            Change is hard.
          </h1>
          <p
            style={{
              maxWidth: "40ch",
              fontSize: "clamp(15px, 1.3vw, 18px)",
              lineHeight: 1.7,
              color: "rgba(250,250,248,0.88)",
              margin: "0 0 clamp(28px, 3.5vw, 44px)",
              textShadow: "0 1px 12px rgba(15,15,13,0.32)",
            }}
          >
            Simulate how your organization will react to a rollout before you
            launch it, team by team and person by person.
          </p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
