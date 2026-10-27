import {
  AbsoluteFill,
  CanvasImage,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Background,
  Browser,
  StillBrowser,
  C,
  Chapter,
  EndFade,
  Enter,
  Icon,
  Label,
  Logo,
  clamp,
  ease,
} from "./design";
import proof from "../public/captures/invoice-payment-proof.json";

export function Problem() {
  const f = useCurrentFrame();
  return <AbsoluteFill>
    <Background />
    <div style={{position:"absolute",left:90,top:65}}><Logo /></div>
    <div style={{position:"absolute",right:90,top:85,fontSize:19,letterSpacing:2,color:C.gold}}>THE PRIVATE DOMAIN AFTERMARKET</div>
    <Enter delay={8} style={{position:"absolute",left:110,top:235,width:850}}>
      <Label tone="gold">Your next acquisition</Label>
      <h1 style={{fontSize:103,lineHeight:1.08,letterSpacing:-5,fontWeight:600,margin:"34px 0"}}>
        Your next brand.<br /><span style={{fontFamily:"Cormorant",fontStyle:"italic",color:C.gold,fontSize:125,fontWeight:500}}>Your private bid.</span>
      </h1>
      <p style={{fontSize:31,color:C.muted,lineHeight:1.6}}>Public bidding can expose your budget,<br />acquisition strategy, and future brand.</p>
    </Enter>
    <Enter delay={24} style={{position:"absolute",left:1040,top:245,width:755,scale:interpolate(f,[0,360],[0.98,1.025],clamp)}}>
      <div style={{padding:35,borderRadius:28,border:"1px solid #6a557e",background:"linear-gradient(140deg,#242035,#10121f)",boxShadow:"0 40px 100px #0006"}}>
        <Label>Actual marketplace listings</Label>
        {["domscout.xyz","multiagentpayments.com","agenticopsai.xyz","everrelay.xyz"].map((domain,i)=><Enter key={domain} delay={35+i*22} style={{padding:"26px 0",borderBottom:"1px solid "+C.line,fontSize:37,fontWeight:600,letterSpacing:-1,color:i===0?C.gold:C.text}}>{domain}</Enter>)}
      </div>
    </Enter>
    <EndFade duration={360}/>
  </AbsoluteFill>;
}
export function Question() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 135,
          textAlign: "center",
        }}
      >
        <Enter>
          <Label>Confidential by design</Label>
        </Enter>
        <div
          style={{
            margin: "40px auto 15px",
            width: 136,
            height: 136,
            borderRadius: 34,
            border: "1px solid #9d7ce477",
            background: "#211a3580",
            display: "grid",
            placeItems: "center",
            rotate: `${interpolate(f, [0, 90], [-8, 0], { ...clamp, easing: ease })}deg`,
          }}
        >
          <Icon kind="seal" size={95} />
        </div>
        <Enter delay={40}>
          <div
            style={{
              fontSize: 117,
              lineHeight: 1.06,
              letterSpacing: -5,
              fontWeight: 600,
            }}
          >
            What if your offer
            <br />
            <span
              style={{
                fontFamily: "Cormorant",
                fontSize: 150,
                fontWeight: 500,
                fontStyle: "italic",
                color: C.violet,
              }}
            >
              stayed yours?
            </span>
          </div>
        </Enter>
        <Enter
          delay={210}
          style={{ display: "flex", justifyContent: "center", marginTop: 52 }}
        >
          <Logo size={75} />
        </Enter>
      </div>
      <EndFade duration={330} />
    </AbsoluteFill>
  );
}
export function Product() {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background />
      <Chapter
        number="03"
        label="The marketplace"
        title="The private domain aftermarket."
        tag="LIVE PRODUCTION · PUBLIC VIEW"
      />
      <Sequence durationInFrames={2 * fps}>
        <StillBrowser src="captures/production-home.png" label="shadowbid-ashy.vercel.app / Production homepage · payments disabled" />
      </Sequence>
      <Sequence from={2 * fps} durationInFrames={6 * fps}>
        <Browser
          src="captures/live-inventory.mp4"
          label="shadowbid-ashy.vercel.app / Owner Auctions"
        />
      </Sequence>
      <Sequence from={8 * fps} durationInFrames={6 * fps}>
        <Browser
          src="captures/live-detail.mp4"
          label="shadowbid-ashy.vercel.app / DNS-verified listing"
        />
      </Sequence>
      <EndFade duration={14 * fps} />
    </AbsoluteFill>
  );
}
export function Bidding() {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <Chapter
        number="04"
        label="Private bidding"
        title="Your offer stays off the public ledger."
        tag="CONTROLLED ACCOUNT DEMONSTRATION"
      />
      <Browser
        src="captures/seal-bid.mp4"
        label="ShadowBid / authenticated bidder · local test"
      />
      <Enter
        delay={8 * fps}
        style={{
          position: "absolute",
          left: 290,
          right: 290,
          bottom: 158,
          padding: "22px 32px",
          border: "1px solid #a187cc",
          background: "#151120f5",
          borderRadius: 20,
          boxShadow: "0 14px 40px #0009",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 26,
            fontSize: 31,
            fontWeight: 600,
          }}
        >
          <span>
            Amount <span style={{ color: C.muted }}>+ secret</span>
          </span>
          <Icon kind="arrow" size={42} />
          <span style={{ color: C.violet }}>SHA-256</span>
          <Icon kind="arrow" size={42} />
          <span style={{ color: C.gold }}>Public commitment</span>
        </div>
        <div
          style={{
            textAlign: "center",
            color: C.muted,
            fontSize: 20,
            marginTop: 12,
          }}
        >
          Also bound to version, auction and bidder · secret never displayed
        </div>
      </Enter>
      {f >= 6 * fps && f < 11 * fps && (
        <Enter
          delay={6 * fps}
          style={{
            position: "absolute",
            right: 225,
            top: 240,
            padding: "22px 28px",
            borderRadius: 18,
            border: "1px solid " + C.green,
            background: "#10241fec",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <Icon kind="file" size={50} color={C.green} />
          <div>
            <strong style={{ fontSize: 28 }}>Secret receipt downloaded</strong>
            <div style={{ fontSize: 21, color: C.muted, marginTop: 8 }}>
              Keep it private. Keep it safe.
            </div>
          </div>
        </Enter>
      )}
      {f < 8 * fps && (
        <Enter
          delay={30}
          style={{
            position: "absolute",
            left: 240,
            top: 178,
            borderRadius: 24,
            padding: "12px 22px",
            background: "#161326ed",
            border: "1px solid #6c5985",
            fontSize: 21,
            color: C.gold,
          }}
        >
          Independent bidder account
        </Enter>
      )}
      <EndFade duration={17 * fps} />
    </AbsoluteFill>
  );
}
export function Reveal() {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background />
      <Chapter
        number="05"
        label="The proof"
        title="A secret receipt. A verifiable reveal."
        tag="PRACTICE AUCTION · ONE DEVICE, TWO ROLES"
      />
      <Sequence durationInFrames={5 * fps}>
        <Browser
          src="captures/receipt.mp4"
          label="ShadowBid /try · genuine browser commitments"
        />
      </Sequence>
      <Sequence from={5 * fps} durationInFrames={3 * fps}>
        <Browser
          src="captures/time-compressed.mp4"
          label="Actual server deadline · waiting period accelerated"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#080a1355",
          }}
        >
          <div
            style={{
              background: "#171222ef",
              border: "1px solid " + C.violet,
              borderRadius: 22,
              padding: "30px 48px",
              fontSize: 40,
              fontWeight: 600,
            }}
          >
            2-minute window{" "}
            <span style={{ color: C.gold }}>· edited for time</span>
          </div>
        </div>
      </Sequence>
      <Sequence from={8 * fps} durationInFrames={6 * fps}>
        <Browser
          src="captures/invalid-reveal.mp4"
          label="Modified receipt · actual server rejection"
        />
        <Enter
          delay={35}
          style={{
            position: "absolute",
            right: 225,
            top: 190,
            padding: "17px 24px",
            borderRadius: 14,
            border: "1px solid " + C.red,
            background: "#2c1424",
            color: C.red,
            fontSize: 27,
            fontWeight: 600,
          }}
        >
          Changed amount → rejected
        </Enter>
      </Sequence>
      <Sequence from={14 * fps} durationInFrames={8 * fps}>
        <Browser
          src="captures/valid-reveal.mp4"
          label="Saved receipt · actual server verification"
        />
        <Enter
          delay={60}
          style={{
            position: "absolute",
            right: 225,
            top: 190,
            padding: "17px 24px",
            borderRadius: 14,
            border: "1px solid " + C.green,
            background: "#102b25",
            color: C.green,
            fontSize: 27,
            fontWeight: 600,
          }}
        >
          Original receipt → verified
        </Enter>
      </Sequence>
      <EndFade duration={22 * fps} />
    </AbsoluteFill>
  );
}
export function Outcome() {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <Chapter
        number="06"
        label="The outcome"
        title="Public price. Private participants."
        tag="PRACTICE → LIVE FINAL PRICE · NOT A COMPLETED SALE"
      />
      <Sequence durationInFrames={4 * fps}>
        <Browser
          src="captures/practice-winner.mp4"
          label="ShadowBid /try · deterministic practice result"
        />
      </Sequence>
      <Sequence from={4 * fps} durationInFrames={11 * fps}>
        <Browser
          src="captures/live-result.mp4"
          label="domscout.xyz / live final winning price · 0.12 ZEC"
        />
        <Enter
          delay={20}
          style={{
            position: "absolute",
            right: 245,
            top: 625,
            padding: "22px 32px",
            borderRadius: 18,
            background: "#1c1828f5",
            border: "1px solid #a98a53",
          }}
        >
          <div style={{ fontSize: 18, letterSpacing: 2, color: C.muted }}>
            LIVE FINAL PRICE · domscout.xyz · 3 SEALED COMMITMENTS
          </div>
          <div
            style={{
              fontSize: 63,
              fontWeight: 600,
              color: C.gold,
              marginTop: 10,
            }}
          >
            0.12 ZEC
          </div>
        </Enter>
      </Sequence>
      {f >= 9 * fps && (
        <Enter
          delay={9 * fps}
          style={{
            position: "absolute",
            left: 290,
            right: 290,
            bottom: 155,
            display: "flex",
            gap: 28,
            padding: "24px 35px",
            borderRadius: 20,
            border: "1px solid #65517d",
            background: "#14111ff5",
          }}
        >
          <Icon kind="lock" size={65} />
          <div>
            <strong style={{ fontSize: 31 }}>
              Identity and losing offers stay private from other users.
            </strong>
            <div style={{ fontSize: 23, color: C.gold, marginTop: 10 }}>
              The operator sees reveals. Domain transfer remains manual.
            </div>
          </div>
        </Enter>
      )}
      <EndFade duration={15 * fps} />
    </AbsoluteFill>
  );
}
export function Checkout() {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Background />
      <Sequence durationInFrames={5 * fps}>
        <Chapter
          number="07"
          label="Private checkout"
          title="An invoice for the winning account."
          tag="ACTUAL LOCAL TESTNET CHECKOUT · PAID"
        />
        <StillBrowser
          src="captures/invoice-paid.png"
          label="ShadowBid / winner-only instructions · token omitted"
          fit="contain"
        />
        <div
          style={{
            position: "absolute",
            right: 225,
            top: 190,
            fontSize: 23,
            padding: "14px 22px",
            borderRadius: 20,
            background: "#312719",
            border: "1px solid " + C.gold,
            color: C.gold,
          }}
        >
          Wallet-verified payment
        </div>
      </Sequence>
      <Sequence from={5 * fps} durationInFrames={9 * fps}>
        <Chapter
          number="07"
          label="Wallet-backed evidence"
          title="Private payment. Verified settlement."
          tag="SANITIZED ACTUAL WALLET OBSERVATION"
        />
        <Enter
          style={{ position: "absolute", left: 120, top: 225, width: 840 }}
        >
          <Label tone="green">Public testnet / Ironwood</Label>
          <div
            style={{
              fontSize: 126,
              fontWeight: 600,
              letterSpacing: -7,
              marginTop: 30,
            }}
          >
            0.01 <span style={{ color: C.gold }}>TAZ</span>
          </div>
          <div style={{ fontSize: 34, color: C.muted, marginTop: 8 }}>
            1,000,000 exact zatoshis
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 38,
            }}
          >
            <Icon kind="check" color={C.green} size={68} />
            <div>
              <strong style={{ fontSize: 42 }}>
                {proof.confirmations.toLocaleString("en-US")} confirmations
              </strong>
              <div style={{ color: C.muted, fontSize: 24, marginTop: 8 }}>
                Zebra active-chain cross-check
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 24,
              color: C.muted,
              marginTop: 44,
              lineHeight: 1.6,
            }}
          >
            Shielded payment details stay off the public ledger.
            <br />
            Regtest: receiving + 3 confirmations.
            <br />
            Controlled self-transfer · wallet-owned receivers.
            <br />
            Production collection remains disabled.
          </div>
        </Enter>
        <Enter
          delay={12}
          style={{
            position: "absolute",
            left: 1005,
            right: 110,
            top: 235,
            padding: 34,
            border: "1px solid #66517d",
            borderRadius: 24,
            background: "#121321",
          }}
        >
          <div
            style={{
              color: C.violet,
              letterSpacing: 2,
              fontSize: 19,
              marginBottom: 27,
            }}
          >
            INVOICE SETTLEMENT / 2026-10-27 UTC
          </div>
          {[
            ["wallet decryption", "verified"],
            ["recipient match", "verified"],
            ["Invoice A", "PAID · 1,000,000 zats"],
            ["Invoice B", "UNPAID · 0 zats"],
          ].map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                padding: "18px 0",
                borderBottom: "1px solid " + C.line,
                fontFamily: "monospace",
                fontSize: 24,
              }}
            >
              <span style={{ color: C.muted }}>{key}</span>
              <span style={{ color: C.green }}>{value}</span>
            </div>
          ))}
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: C.muted,
              marginTop: 24,
              lineHeight: 1.6,
            }}
          >
            TXID
            <br />
            <span style={{ overflowWrap: "anywhere", color: C.text }}>
              {proof.transaction_id}
            </span>
          </div>
        </Enter>
        <Enter
          delay={22}
          style={{
            position: "absolute",
            left: 120,
            right: 110,
            bottom: 151,
            padding: "25px 30px",
            borderRadius: 18,
            border: "1px solid #937746",
            background: "#2b241a",
            fontSize: 32,
            color: C.gold,
            textAlign: "center",
          }}
        >
          Restart + replay checks passed · No escrow or automatic domain transfer
        </Enter>
      </Sequence>
      <EndFade duration={14 * fps} />
    </AbsoluteFill>
  );
}
export function Closing() {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <Sequence durationInFrames={5 * fps}>
        <Enter style={{ position: "absolute", left: 120, top: 145 }}>
          <Label tone="gold">The direction</Label>
          <h2
            style={{
              fontSize: 100,
              lineHeight: 1.05,
              letterSpacing: -4,
              fontWeight: 600,
              margin: "32px 0",
            }}
          >
            Domains today.
            <br />
            <span
              style={{
                fontFamily: "Cormorant",
                fontStyle: "italic",
                fontWeight: 500,
                color: C.violet,
              }}
            >
              Private markets tomorrow.
            </span>
          </h2>
        </Enter>
        <div
          style={{
            position: "absolute",
            left: 120,
            right: 120,
            top: 505,
            display: "flex",
            gap: 26,
          }}
        >
          {[
            ["Domain names", "LIVE AUCTION CATEGORY", C.gold],
            ["Art", "FUTURE DIRECTION", C.muted],
            ["NFTs", "FUTURE DIRECTION", C.muted],
          ].map(([title, state, color], i) => (
            <Enter
              key={title}
              delay={12 + i * 9}
              style={{
                flex: 1,
                padding: 38,
                borderRadius: 22,
                border: "1px solid " + C.line,
                background: "#171522",
              }}
            >
              <Icon kind={i === 0 ? "seal" : "lock"} size={66} color={color} />
              <div style={{ fontSize: 39, fontWeight: 600, marginTop: 20 }}>
                {title}
              </div>
              <div
                style={{ fontSize: 18, letterSpacing: 2, color, marginTop: 16 }}
              >
                {state}
              </div>
            </Enter>
          ))}
        </div>
      </Sequence>
      <Sequence from={5 * fps} durationInFrames={7 * fps}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 127,
            textAlign: "center",
          }}
        >
          <Enter style={{ display: "flex", justifyContent: "center" }}>
            <Logo size={115} />
          </Enter>
          <Enter delay={14}>
            <h2
              style={{
                fontSize: 113,
                fontWeight: 600,
                lineHeight: 1.03,
                letterSpacing: -5,
                margin: "46px 0 28px",
              }}
            >
              Private auctions.
              <br />
              <span style={{ color: C.gold }}>Public outcomes.</span>
            </h2>
          </Enter>
          <Enter delay={28}>
            <div style={{ fontSize: 35, color: C.muted }}>
              Starting with domains. Built for private markets.
            </div>
          </Enter>
          <Enter delay={50} style={{ marginTop: 60 }}>
            <div style={{ fontSize: 35, color: C.violet, fontWeight: 600 }}>
              shadowbid-ashy.vercel.app
            </div>
            <div
              style={{
                fontSize: 23,
                color: C.text,
                letterSpacing: 1,
                marginTop: 20,
              }}
            >
              TRY THE INTERACTIVE DEMO ↗
            </div>
          </Enter>
        </div>
      </Sequence>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg,#8d6ac8,#edc97e)",
          scale: `${interpolate(f, [0, 12 * fps], [0, 1], clamp)} 1`,
          transformOrigin: "left",
        }}
      />
      <EndFade duration={12 * fps} />
    </AbsoluteFill>
  );
}
export function Thumbnail() {
  return (
    <AbsoluteFill style={{ fontFamily: "Inter", color: C.text }}>
      <Background />
      <div style={{ position: "absolute", left: 110, top: 80 }}>
        <Logo size={85} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 110,
          top: 106,
          color: C.gold,
          letterSpacing: 3,
          fontSize: 24,
        }}
      >
        ZECATHON 2026 · PRIVATE MARKETS
      </div>
      <div style={{ position: "absolute", left: 110, top: 300 }}>
        <Label>Confidential domain acquisition</Label>
        <h1
          style={{
            fontSize: 132,
            lineHeight: 1.04,
            fontWeight: 600,
            letterSpacing: -6,
            margin: "36px 0",
          }}
        >
          Your bid is
          <br />
          <span
            style={{
              fontFamily: "Cormorant",
              fontStyle: "italic",
              fontSize: 170,
              color: C.gold,
              fontWeight: 500,
            }}
          >
            your business.
          </span>
        </h1>
        <div style={{ fontSize: 34, color: C.muted }}>
          Private auctions. Public outcomes.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 160,
          top: 330,
          width: 430,
          height: 420,
          borderRadius: 70,
          border: "1px solid #9873bd",
          background: "linear-gradient(135deg,#382b50,#121421)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rotate: "-7deg",
          boxShadow: "0 40px 100px #0008",
        }}
      >
        <CanvasImage
          src={staticFile("brand/shadowbid-icon.png")}
          style={{ width: 210, height: 210 }}
        />
        <div
          style={{
            marginTop: 20,
            color: C.violet,
            fontSize: 25,
            letterSpacing: 4,
          }}
        >
          SEALED OFFER
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 115,
          bottom: 110,
          color: C.violet,
          fontSize: 29,
        }}
      >
        THE TWO-MINUTE PRODUCT DEMO ↗
      </div>
    </AbsoluteFill>
  );
}
