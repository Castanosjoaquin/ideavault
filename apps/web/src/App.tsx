import { CORE_VERSION } from "@ideavault/core";

function App() {
  return (
    <div style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1>IdeaVault</h1>
      <p>Core version: {CORE_VERSION}</p>
    </div>
  );
}

export default App;
