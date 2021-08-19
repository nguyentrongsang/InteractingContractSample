import { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import "./App.css";
import SignedData from "./components/SignedData";
import { useEagerConnect, useInactiveListener } from "./common/hooks";
import { injected } from "./utils/connectors";

function App() {
  const { connector, activate } = useWeb3React();

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = useState();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  useEffect(() => {
    setActivatingConnector(injected);
    activate(injected);
  }, []);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  return (
    <div className="App">
      <SignedData />
    </div>
  );
}

export default App;
