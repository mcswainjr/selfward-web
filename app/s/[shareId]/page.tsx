export default function Home() {
  return (
    <main style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      fontFamily: "system-ui"
    }}>
      <h1 style={{fontSize: "40px", marginBottom: "10px"}}>
        Selfward
      </h1>

      <p style={{fontSize: "18px", opacity: 0.7}}>
        What you need to hear, when you need it most.
      </p>

      <div style={{marginTop: "30px"}}>
        <a href="#" style={{marginRight: "20px"}}>
          Download on App Store
        </a>

        <a href="#">
          Get it on Google Play
        </a>
      </div>
    </main>
  );
}