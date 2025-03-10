import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import { StaticJsonRpcProvider, JsonRpcProvider, Web3Provider, InfuraProvider } from "@ethersproject/providers";
import "./App.css";
import { Row, Col, Button, Menu, Alert, Switch as SwitchD } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import { Balance, Header, Account, Faucet, Ramp, Contract, GasGauge, Address, ThemeSwitch } from "./components";
import { useExchangePrice, useGasPrice, useUserProvider, useContractLoader, useContractReader, useEventListener, useBalance, useExternalContractLoader, useOnBlock } from "./hooks";
import { Transactor } from "./helpers";
import { formatEther, parseEther } from "@ethersproject/units";
//import Hints from "./Hints";
import { Hints, ExampleUI, Subgraph } from "./views"
import { useThemeSwitcher } from "react-css-theme-switcher";
import { INFURA_ID, DAI_ADDRESS, DAI_ABI, NETWORK, NETWORKS } from "./constants";
import { CreateTransaction, Transactions, Owners, FrontPage } from "./views"

/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/


/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS['localhost']; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// const poolServerUrl = "https://backend.multisig.holdings:49832/"
const poolServerUrl = "http://localhost:49832/"

// 😬 Sorry for all the console logging
const DEBUG = true


// 🛰 providers
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
const scaffoldEthProvider = new JsonRpcProvider("https://rpc.scaffoldeth.io:48544")
const mainnetInfura = new JsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
const localProvider = new StaticJsonRpcProvider(localProviderUrlFromEnv);


// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;




function App(props) {

  const mainnetProvider = (scaffoldEthProvider && scaffoldEthProvider._network) ? scaffoldEthProvider : mainnetInfura

  const [injectedProvider, setInjectedProvider] = useState();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);

  // You can warn the user if you would like them to be on a specific network
  let localChainId = localProvider && localProvider._network && localProvider._network.chainId
  let selectedChainId = userProvider && userProvider._network && userProvider._network.chainId

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice)

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice)

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider)

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider)

  const contractName = "MetaMultiSigWallet"

  //📟 Listen for broadcast events
  const executeTransactionEvents = useEventListener(readContracts, contractName, "ExecuteTransaction", localProvider, 1);

  //Get user role
  const userRole = useContractReader(readContracts, contractName, "userRole", [address])
  if (DEBUG) console.log("🤗 User (" + address + ") Role:", userRole)

  // keep track of a variable from the contract in the local React state:
  const nonce = useContractReader(readContracts, contractName, "nonce")

  //📟 Listen for broadcast events
  const ownerEvents = useEventListener(readContracts, contractName, "Owner", localProvider, 1);

  //Listen for role related events
  const roleGrantedEvents = useEventListener(readContracts, contractName, "RoleGranted", localProvider, 1);
  if (DEBUG) console.log("roleGrantedEvents:", roleGrantedEvents)

  const roleRevokedEvents = useEventListener(readContracts, contractName, "RoleRevoked", localProvider, 1);
  if (DEBUG) console.log("roleRevokedEvents:", roleRevokedEvents)

  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetDAIContract = useExternalContractLoader(mainnetProvider, DAI_ADDRESS, DAI_ABI)

  // If you want to call a function on a new block
  /*useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`)
  })*/

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader({ DAI: mainnetDAIContract }, "DAI", "balanceOf", ["0x34aA3F359A9D614239015126635CE7732c18fDF3"])

  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader(readContracts, "YourContract", "purpose")

  //📟 Listen for broadcast events
  const setPurposeEvents = useEventListener(readContracts, "YourContract", "SetPurpose", localProvider, 1);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  /*useEffect(() => {
    if (DEBUG && mainnetProvider && address && selectedChainId && yourLocalBalance && yourMainnetBalance && readContracts && writeContracts && mainnetDAIContract) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________")
      console.log("🌎 mainnetProvider", mainnetProvider)
      console.log("🏠 localChainId", localChainId)
      console.log("👩‍💼 selected address:", address)
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId)
      console.log("💵 yourLocalBalance", yourLocalBalance ? formatEther(yourLocalBalance) : "...")
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? formatEther(yourMainnetBalance) : "...")
      console.log("📝 readContracts", readContracts)
      console.log("🌍 DAI contract on mainnet:", mainnetDAIContract)
      console.log("🔐 writeContracts", writeContracts)
    }
  }, [mainnetProvider, address, selectedChainId, yourLocalBalance, yourMainnetBalance, readContracts, writeContracts, mainnetDAIContract])*/


  let networkDisplay = ""
  if (localChainId && selectedChainId && localChainId != selectedChainId) {
    networkDisplay = (
      <div style={{ zIndex: 2, position: 'absolute', right: 0, top: 60, padding: 16 }}>
        <Alert
          message={"⚠️ Wrong Network"}
          description={(
            <div>
              You have <b>{NETWORK(selectedChainId).name}</b> selected and you need to be on <b>{NETWORK(localChainId).name}</b>.
            </div>
          )}
          type="error"
          closable={false}
        />
      </div>
    )
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: 'absolute', right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    )
  }


  const signaturesRequired = useContractReader(readContracts, contractName, "signaturesRequired")

  //event OpenStream( address indexed to, uint256 amount, uint256 frequency );
  /*const openStreamEvents = useEventListener(readContracts, contractName, "OpenStream", localProvider, 1);
  if (DEBUG) console.log("📟 openStreamEvents:", openStreamEvents)

  const withdrawStreamEvents = useEventListener(readContracts, contractName, "Withdraw", localProvider, 1);
  if (DEBUG) console.log("📟 withdrawStreamEvents:", withdrawStreamEvents)*/


  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname)
  }, [setRoute]);

  let faucetHint = ""
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name == "localhost"

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (!faucetClicked && localProvider && localProvider._network && localProvider._network.chainId == 31337 && yourLocalBalance && formatEther(yourLocalBalance) <= 0) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button type={"primary"} onClick={() => {
          faucetTx({
            to: address,
            value: parseEther("1"),
          });
          setFaucetClicked(true)
        }}>
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    )
  }

  return (
    <div className="App">

      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      {networkDisplay}
      <BrowserRouter>

        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link onClick={() => { setRoute("/") }} to="/">MultiSig</Link>
          </Menu.Item>
          <Menu.Item key="/owners">
            <Link onClick={() => { setRoute("/owners") }} to="/owners">Owners</Link>
          </Menu.Item>
          <Menu.Item key="/create">
            <Link onClick={() => { setRoute("/create") }} to="/create">Create</Link>
          </Menu.Item>
          <Menu.Item key="/pool">
            <Link onClick={() => { setRoute("/pool") }} to="/pool">Pool</Link>
          </Menu.Item>
          <Menu.Item key="/debug">
            <Link onClick={() => { setRoute("/debug") }} to="/debug">Debug</Link>
          </Menu.Item>
        </Menu>

        <Switch>
          <Route exact path="/">
            <FrontPage
              executeTransactionEvents={executeTransactionEvents}
              contractName={contractName}
              localProvider={localProvider}
              readContracts={readContracts}
              price={price}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              role={userRole}
            />
          </Route>
          { /* uncomment for a second contract:
            <Contract
              name="SecondContract"
              signer={userProvider.getSigner()}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
            */ }

          { /* Uncomment to display and interact with an external contract (DAI on mainnet):
            <Contract
              name="DAI"
              customContract={mainnetDAIContract}
              signer={userProvider.getSigner()}
              provider={mainnetProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
            */ }
          <Route exact path="/owners">
            <Owners
              contractName={contractName}
              address={address}
              userProvider={userProvider}
              mainnetProvider={mainnetProvider}
              localProvider={localProvider}
              yourLocalBalance={yourLocalBalance}
              price={price}
              tx={tx}
              writeContracts={writeContracts}
              readContracts={readContracts}
              blockExplorer={blockExplorer}
              nonce={nonce}
              ownerEvents={ownerEvents}
              signaturesRequired={signaturesRequired}
            />
          </Route>
          <Route path="/create">
            <CreateTransaction
              poolServerUrl={poolServerUrl}
              contractName={contractName}
              address={address}
              userProvider={userProvider}
              mainnetProvider={mainnetProvider}
              localProvider={localProvider}
              yourLocalBalance={yourLocalBalance}
              price={price}
              tx={tx}
              writeContracts={writeContracts}
              readContracts={readContracts}
              setRoute={setRoute}
            />
          </Route>
          <Route path="/pool">
            <Transactions
              poolServerUrl={poolServerUrl}
              contractName={contractName}
              address={address}
              userProvider={userProvider}
              mainnetProvider={mainnetProvider}
              localProvider={localProvider}
              yourLocalBalance={yourLocalBalance}
              price={price}
              tx={tx}
              writeContracts={writeContracts}
              readContracts={readContracts}
              blockExplorer={blockExplorer}
              nonce={nonce}
              signaturesRequired={signaturesRequired}
            />
          </Route>
          <Route path="/debug">
            <Contract
              name="MetaMultiSigWallet"
              signer={userProvider.getSigner()}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              purpose={purpose}
              setPurposeEvents={setPurposeEvents}
            />
          </Route>
          <Route path="/mainnetdai">
            <Contract
              name="DAI"
              customContract={mainnetDAIContract}
              signer={userProvider.getSigner()}
              provider={mainnetProvider}
              address={address}
              blockExplorer={"https://etherscan.io/"}
            />
          </Route>
          <Route path="/subgraph">
            <Subgraph
              subgraphUri={props.subgraphUri}
              tx={tx}
              writeContracts={writeContracts}
              mainnetProvider={mainnetProvider}
            />
          </Route>
        </Switch>
      </BrowserRouter>

      <ThemeSwitch />


      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userProvider={userProvider}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
        {faucetHint}
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {

              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>

    </div>
  );
}


/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

window.ethereum && window.ethereum.on('chainChanged', chainId => {
  web3Modal.cachedProvider &&
    setTimeout(() => {
      window.location.reload();
    }, 1);
})

window.ethereum && window.ethereum.on('accountsChanged', accounts => {
  web3Modal.cachedProvider &&
    setTimeout(() => {
      window.location.reload();
    }, 1);
})

export default App;
