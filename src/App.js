import React, { useState, useEffect } from "react";
import "./App.css";
import { ethers } from "ethers";
import { Icon, Tooltip } from "web3uikit";
import svg from "./svgviewer-output.svg";
import abi from "./utils/Domains.json";
import { networks } from "./utils/networks.js";
import { SiTwitter, SiInstagram, SiDiscord, SiFacebook } from "react-icons/si";
const tld = ".tetas";

function App() {
  // console.log(process.env);
  const contractAddress = "0x9b971c13E8e4e80AdC6c103668E037788E8692F0"; //contract address
  const contractABI = abi.abi; //contract ABI file

  //Use State Hook
  const [network, setNetwork] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentDomain, setCurrentDomain] = useState("");
  const [currentRecord, setCurrentRecord] = useState("");
  const [mints, setMints] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  //Checking if the user metamask wallet is connected or not to the App
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have metamask installed!!");
      return;
    } else {
      console.log("We have the ethereum object");
    }
    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account", account);
      setCurrentAccount(account);
      console.log(currentAccount);
    } else {
      console.log("No authorized account found");
    }
    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);
    ethereum.on("chainChanged", handleChainChanged);
    function handleChainChanged() {
      window.location.reload();
    }
  };

  //connect metamask wallet
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get metamask");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected:", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  //switch between different chains my app works on only polygon testnet
  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13881" }],
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "waller_addEthereumChain",
              params: [
                {
                  chainId: "0x13881",
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert("Get Metamask");
    }
  };

  //Minting a new domain using the contract
  const mintDomain = async () => {
    if (!currentDomain) return;
    if (currentDomain.length < 3) {
      alert("Domain name must be at least 3 letters long");
      return;
    }
    const price =
      currentDomain.length === 3
        ? "0.5"
        : currentDomain.length === 4
        ? "0.3"
        : "0.1";
    console.log("Minting domain", currentDomain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        console.log("Going to pop wallet to pay gas:");
        let txn = await contract.createDomain(currentDomain, {
          value: ethers.utils.parseEther(price),
        });
        const receipt = await txn.wait();
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + txn.hash
          );
          txn = await contract.setRecord(currentDomain, currentRecord);
          await txn.wait();
          console.log(
            "Record set! https://mumbai.polygonscan.com/tx/" + txn.hash
          );
          setTimeout(() => {
            fetchMints();
          }, 5000);
          setCurrentRecord("");
          setCurrentDomain("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  //fetching the minted domains data to be displayed
  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const names = await contract.getAllNames();
        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //withdraw funds can only be accessed by the owner of the contract
  const withdrawFunds = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const txn = await contract.withdraw();
        await txn.wait();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderNotConnectedContainer = () => {
    return (
      <div className="connect-wallet-container">
        <div className="connect-wallet-heading">
          <div className="header-title">
            <svg
              width="80"
              height="42"
              viewBox="0 0 80 42"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M49.7775 1.81496C49.0057 1.80033 48.2443 1.99027 47.57 2.36406C46.8956 2.73785 46.3316 3.28375 45.9344 3.94521L40.0418 14.1083L35.9579 20.87L30.0652 31.0331C29.6686 31.6954 29.104 32.2404 28.4297 32.6142C27.7554 32.988 26.9935 33.1771 26.2221 33.1633L16.925 32.919C16.1577 32.8927 15.4098 32.6714 14.7518 32.276C14.0935 31.8805 13.5448 31.3238 13.1597 30.658L8.64616 22.5152C8.25906 21.8437 8.06233 21.0804 8.07598 20.3068C8.08942 19.5338 8.31346 18.7791 8.72397 18.1239L13.3942 10.2872C13.7908 9.62487 14.3554 9.07983 15.0297 8.70605C15.704 8.33226 16.4659 8.1432 17.2373 8.15695L26.3581 8.34921C27.1253 8.37551 27.8732 8.59681 28.5313 8.99223C29.1895 9.38769 29.7383 9.94447 30.1233 10.6103L33.0477 15.886L37.0681 9.00969L34.1437 3.73399C33.7794 3.04985 33.2363 2.47851 32.573 2.08014C31.9103 1.6819 31.1516 1.47196 30.3784 1.47293L13.4077 0.98423C12.6359 0.969604 11.8745 1.15954 11.2001 1.53333C10.5258 1.90712 9.96175 2.45303 9.56464 3.11448L0.760324 17.8905C0.349808 18.5457 0.125773 19.3004 0.112339 20.0734C0.0986836 20.847 0.295903 21.6112 0.682516 22.2818L9.13808 37.5361C9.50244 38.2202 10.0455 38.7916 10.7088 39.1899C11.3715 39.5882 12.1302 39.7981 12.9034 39.7971L30.0997 40.1607C30.8716 40.1754 31.633 39.9854 32.3073 39.6117C32.9816 39.2379 33.5457 38.692 33.9428 38.0305L39.899 27.982L43.9194 21.1057L49.8756 11.0572C50.2722 10.3949 50.8367 9.84986 51.5111 9.47608C52.1854 9.10229 52.9473 8.91323 53.7186 8.92698L62.8394 9.11924C63.6067 9.14554 64.3546 9.36684 65.0126 9.76226C65.6709 10.1577 66.2196 10.7145 66.6047 11.3803L71.1187 19.5239C71.5058 20.1954 71.7026 20.9587 71.6889 21.7323C71.6755 22.5053 71.4515 23.26 71.0409 23.9152L66.4342 31.8665C66.0376 32.5288 65.4731 33.0739 64.7987 33.4477C64.1244 33.8214 63.3625 34.0105 62.5911 33.9968L53.4704 33.8045C52.7031 33.7782 51.9552 33.5569 51.2971 33.1615C50.638 32.7665 50.0902 32.2092 49.7051 31.5434L46.7807 26.2677L42.7603 33.144L45.6847 38.4197C46.0491 39.1039 46.5922 39.6752 47.2554 40.0736C47.9181 40.4718 48.6769 40.6817 49.45 40.6808L66.6464 41.0444C67.4182 41.059 68.1796 40.8691 68.8539 40.4953C69.5283 40.1215 70.0923 39.5756 70.4894 38.9141L79.2938 24.1381C79.6774 23.475 79.8862 22.7235 79.9001 21.9543C79.9139 21.1852 79.7321 20.4262 79.3724 19.7463L70.9164 4.49118C70.552 3.80705 70.0089 3.23571 69.3456 2.83733C68.683 2.4391 67.9242 2.22916 67.1511 2.23013L49.7784 1.81447L49.7775 1.81496Z"
                fill="#7B3FE4"
              />
            </svg>
            <p>Tetas Name Service</p>
          </div>
          <div className="header-explain">
            your immortal API on the <span>blockchain</span>
          </div>
          <button
            className="cta-button connect-wallet-button "
            onClick={connectWallet}
          >
            <Icon fill="#000000" size={36} svg="metamask" />
          </button>
        </div>
        <img src={svg} alt="" width="270" height="270"></img>
      </div>
    );
  };

  const nav = () => {
    return (
      <nav className="navbar">
        <div className="nav-title">
          <svg
            width="80"
            height="42"
            viewBox="0 0 80 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M49.7775 1.81496C49.0057 1.80033 48.2443 1.99027 47.57 2.36406C46.8956 2.73785 46.3316 3.28375 45.9344 3.94521L40.0418 14.1083L35.9579 20.87L30.0652 31.0331C29.6686 31.6954 29.104 32.2404 28.4297 32.6142C27.7554 32.988 26.9935 33.1771 26.2221 33.1633L16.925 32.919C16.1577 32.8927 15.4098 32.6714 14.7518 32.276C14.0935 31.8805 13.5448 31.3238 13.1597 30.658L8.64616 22.5152C8.25906 21.8437 8.06233 21.0804 8.07598 20.3068C8.08942 19.5338 8.31346 18.7791 8.72397 18.1239L13.3942 10.2872C13.7908 9.62487 14.3554 9.07983 15.0297 8.70605C15.704 8.33226 16.4659 8.1432 17.2373 8.15695L26.3581 8.34921C27.1253 8.37551 27.8732 8.59681 28.5313 8.99223C29.1895 9.38769 29.7383 9.94447 30.1233 10.6103L33.0477 15.886L37.0681 9.00969L34.1437 3.73399C33.7794 3.04985 33.2363 2.47851 32.573 2.08014C31.9103 1.6819 31.1516 1.47196 30.3784 1.47293L13.4077 0.98423C12.6359 0.969604 11.8745 1.15954 11.2001 1.53333C10.5258 1.90712 9.96175 2.45303 9.56464 3.11448L0.760324 17.8905C0.349808 18.5457 0.125773 19.3004 0.112339 20.0734C0.0986836 20.847 0.295903 21.6112 0.682516 22.2818L9.13808 37.5361C9.50244 38.2202 10.0455 38.7916 10.7088 39.1899C11.3715 39.5882 12.1302 39.7981 12.9034 39.7971L30.0997 40.1607C30.8716 40.1754 31.633 39.9854 32.3073 39.6117C32.9816 39.2379 33.5457 38.692 33.9428 38.0305L39.899 27.982L43.9194 21.1057L49.8756 11.0572C50.2722 10.3949 50.8367 9.84986 51.5111 9.47608C52.1854 9.10229 52.9473 8.91323 53.7186 8.92698L62.8394 9.11924C63.6067 9.14554 64.3546 9.36684 65.0126 9.76226C65.6709 10.1577 66.2196 10.7145 66.6047 11.3803L71.1187 19.5239C71.5058 20.1954 71.7026 20.9587 71.6889 21.7323C71.6755 22.5053 71.4515 23.26 71.0409 23.9152L66.4342 31.8665C66.0376 32.5288 65.4731 33.0739 64.7987 33.4477C64.1244 33.8214 63.3625 34.0105 62.5911 33.9968L53.4704 33.8045C52.7031 33.7782 51.9552 33.5569 51.2971 33.1615C50.638 32.7665 50.0902 32.2092 49.7051 31.5434L46.7807 26.2677L42.7603 33.144L45.6847 38.4197C46.0491 39.1039 46.5922 39.6752 47.2554 40.0736C47.9181 40.4718 48.6769 40.6817 49.45 40.6808L66.6464 41.0444C67.4182 41.059 68.1796 40.8691 68.8539 40.4953C69.5283 40.1215 70.0923 39.5756 70.4894 38.9141L79.2938 24.1381C79.6774 23.475 79.8862 22.7235 79.9001 21.9543C79.9139 21.1852 79.7321 20.4262 79.3724 19.7463L70.9164 4.49118C70.552 3.80705 70.0089 3.23571 69.3456 2.83733C68.683 2.4391 67.9242 2.22916 67.1511 2.23013L49.7784 1.81447L49.7775 1.81496Z"
              fill="#7B3FE4"
            />
          </svg>
          <p>Tetas Name Service</p>
        </div>
        <div className="user-address">
          <p>{currentAccount}</p>
          <a
            href={
              network.includes("Polygon")
                ? "https://mumbai.polygonscan.com/address/" + currentAccount
                : "https://etherscan.io/address/" + currentAccount
            }
            target="_blank"
            rel="noreferrer"
          >
            <Tooltip
              content={
                network.includes("Polygon")
                  ? "View on polygonscan"
                  : "View on etherscan"
              }
              position="left"
            >
              <Icon
                fill="rgb(123,63,228)"
                size={24}
                svg={network.includes("Polygon") ? "matic" : "eth"}
              />
            </Tooltip>
          </a>
        </div>
      </nav>
    );
  };

  const renderInputForm = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div className="switch-wallet-container">
          <p className="network-switch">
            Please switch to Polygon Mumbai network
          </p>
          <button
            className="cta-button connect-wallet-button"
            onClick={switchNetwork}
          >
            Switch Network
          </button>
        </div>
      );
    }
    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={currentDomain}
            maxLength="10"
            placeholder="domain"
            onChange={(e) => setCurrentDomain(e.target.value)}
          />
          <p className="tld">{tld}</p>
        </div>
        <input
          type="text"
          value={currentRecord}
          placeholder="who's your favorite star"
          onChange={(e) => setCurrentRecord(e.target.value)}
        />
        {editing ? (
          <div className="button-container">
            <button
              className="cta-button mint-button"
              disabled={loading}
              onClick={updateDomain}
            >
              Set Record
            </button>
            <button className="cta-button mint-button" onClick={cancelUpdate}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="cta-button mint-button"
            disabled={loading}
            onClick={mintDomain}
          >
            MINT
          </button>
        )}
      </div>
    );
  };

  const updateDomain = async () => {
    if (!currentRecord || !currentDomain) {
      return;
    }
    setLoading(true);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let tx = await contract.setRecord(currentDomain, currentRecord);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);
        fetchMints();
        setCurrentRecord("");
        setCurrentDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="mints-container">
          <p className="subtitle">
            <span>Tetas</span> Gallery
          </p>

          <div className="mint-list">
            {mints.map((mint, i) => {
              return (
                <div className="mint-item" key={i}>
                  {mint.owner.toLowerCase() === currentAccount.toLowerCase() ? (
                    <button
                      className="edit-button"
                      onClick={() => editRecord(mint.name)}
                    >
                      <Tooltip content="Edit" position="right">
                        <Icon fill="#000000" size={24} svg="edit" />
                      </Tooltip>
                    </button>
                  ) : null}
                  <a
                    className="link"
                    href={`https://testnets.opensea.io/assets/mumbai/${contractAddress}/${mint.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Tooltip content="View on OpenSea" position="top">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="90"
                        height="90"
                        viewBox="0 0 90 90"
                        fill="none"
                      >
                        <path
                          d="M90 45C90 69.8514 69.8514 90 45 90C20.1486 90 0 69.8514 0 45C0 20.1486 20.1486 0 45 0C69.8566 0 90 20.1486 90 45Z"
                          fill="#2081E2"
                        />
                        <path
                          d="M22.2011 46.512L22.3953 46.2069L34.1016 27.8939C34.2726 27.6257 34.6749 27.6535 34.8043 27.9447C36.76 32.3277 38.4475 37.7786 37.6569 41.1721C37.3194 42.5683 36.3948 44.4593 35.3545 46.2069C35.2204 46.4612 35.0725 46.7109 34.9153 46.9513C34.8413 47.0622 34.7165 47.127 34.5824 47.127H22.5432C22.2196 47.127 22.0301 46.7756 22.2011 46.512Z"
                          fill="white"
                        />
                        <path
                          d="M74.38 49.9149V52.8137C74.38 52.9801 74.2783 53.1281 74.1304 53.1928C73.2242 53.5812 70.1219 55.0052 68.832 56.799C65.5402 61.3807 63.0251 67.932 57.4031 67.932H33.949C25.6362 67.932 18.9 61.1727 18.9 52.8322V52.564C18.9 52.3421 19.0803 52.1618 19.3023 52.1618H32.377C32.6359 52.1618 32.8255 52.4022 32.8024 52.6565C32.7099 53.5072 32.8671 54.3764 33.2693 55.167C34.0461 56.7435 35.655 57.7283 37.3934 57.7283H43.866V52.675H37.4673C37.1391 52.675 36.9449 52.2959 37.1345 52.0277C37.2038 51.9214 37.2824 51.8104 37.3656 51.6856C37.9713 50.8257 38.8358 49.4895 39.6958 47.9684C40.2829 46.9421 40.8516 45.8463 41.3093 44.746C41.4018 44.5472 41.4758 44.3438 41.5497 44.1449C41.6746 43.7936 41.804 43.4653 41.8965 43.1371C41.9889 42.8597 42.0629 42.5684 42.1369 42.2956C42.3542 41.3617 42.4467 40.3723 42.4467 39.3459C42.4467 38.9437 42.4282 38.523 42.3912 38.1207C42.3727 37.6815 42.3172 37.2423 42.2617 36.8031C42.2247 36.4147 42.1554 36.031 42.0814 35.6288C41.9889 35.0416 41.8595 34.4591 41.7115 33.8719L41.6607 33.65C41.5497 33.2478 41.4573 32.864 41.3278 32.4618C40.9626 31.1996 40.5418 29.9698 40.098 28.8186C39.9362 28.3609 39.7512 27.9217 39.5663 27.4825C39.2935 26.8213 39.0161 26.2203 38.7619 25.6516C38.6324 25.3927 38.5214 25.1569 38.4105 24.9165C38.2857 24.6437 38.1562 24.371 38.0268 24.112C37.9343 23.9132 37.8279 23.7283 37.754 23.5434L36.9634 22.0824C36.8524 21.8836 37.0374 21.6478 37.2546 21.7079L42.2016 23.0487H42.2155C42.2247 23.0487 42.2294 23.0533 42.234 23.0533L42.8859 23.2336L43.6025 23.437L43.866 23.511V20.5706C43.866 19.1512 45.0034 18 46.4089 18C47.1116 18 47.7496 18.2866 48.2073 18.7536C48.665 19.2206 48.9517 19.8586 48.9517 20.5706V24.935L49.4787 25.0829C49.5204 25.0968 49.562 25.1153 49.599 25.143C49.7284 25.2401 49.9133 25.3835 50.1491 25.5591C50.3341 25.7071 50.5329 25.8874 50.7733 26.0723C51.2495 26.4561 51.8181 26.9508 52.4423 27.5194C52.6087 27.6628 52.7706 27.8107 52.9185 27.9587C53.723 28.7076 54.6245 29.5861 55.4845 30.557C55.7249 30.8297 55.9607 31.1071 56.2011 31.3984C56.4415 31.6943 56.6958 31.9856 56.9177 32.2769C57.209 32.6652 57.5233 33.0674 57.7961 33.4882C57.9256 33.687 58.0735 33.8904 58.1984 34.0892C58.5497 34.6209 58.8595 35.1711 59.1554 35.7212C59.2802 35.9755 59.4097 36.2529 59.5206 36.5257C59.8489 37.2608 60.1078 38.0098 60.2742 38.7588C60.3251 38.9206 60.3621 39.0963 60.3806 39.2535V39.2904C60.436 39.5124 60.4545 39.7482 60.473 39.9886C60.547 40.756 60.51 41.5235 60.3436 42.2956C60.2742 42.6239 60.1818 42.9336 60.0708 43.2619C59.9598 43.5763 59.8489 43.9045 59.7056 44.2143C59.4282 44.8569 59.0999 45.4996 58.7115 46.1006C58.5867 46.3225 58.4388 46.5583 58.2908 46.7802C58.129 47.016 57.9626 47.238 57.8146 47.4553C57.6112 47.7327 57.3939 48.0239 57.172 48.2828C56.9732 48.5556 56.7697 48.8284 56.5478 49.0688C56.2381 49.434 55.9422 49.7808 55.6324 50.1137C55.4475 50.331 55.2487 50.5529 55.0452 50.7517C54.8464 50.9736 54.643 51.1724 54.4581 51.3573C54.1483 51.6671 53.8894 51.9075 53.6721 52.1063L53.1635 52.5733C53.0896 52.638 52.9925 52.675 52.8908 52.675H48.9517V57.7283H53.9079C55.0175 57.7283 56.0716 57.3353 56.9223 56.6141C57.2136 56.3598 58.485 55.2594 59.9876 53.5997C60.0384 53.5442 60.1032 53.5026 60.1771 53.4841L73.8668 49.5265C74.1211 49.4525 74.38 49.6467 74.38 49.9149Z"
                          fill="white"
                        />
                      </svg>
                    </Tooltip>
                  </a>
                  <div className="mint-row">
                    <p className="underlined">
                      {" "}
                      {mint.name}
                      {tld}{" "}
                    </p>
                  </div>
                  <p className="mint-record"> {mint.record} </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };
  const editRecord = (name) => {
    setEditing(true);
    setCurrentDomain(name);
  };
  const renderWithdrawButton = () => {
    if (currentAccount === `${process.env.REACT_APP_PUBLIC_ADDRESS}`) {
      return (
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <button className="cta-button mint-button" onClick={withdrawFunds}>
            withdraw
          </button>
        </div>
      );
    }
  };
  const cancelUpdate = () => {
    setEditing(false);
    setCurrentDomain("");
  };
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (network === "Polygon Mumbai Testnet") {
      fetchMints();
    }
  }, [currentAccount, network]);

  return (
    <div className="App">
      <div className="container">
        {/* <div className="header-container">
          <header>
            <div className="left">
              <p className="title">Tetas Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
          </header>
        </div> */}
        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && nav()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}
        {renderWithdrawButton()}
        <footer className="social-footer">
          <a
            href="https://twitter.com/ManasMG24"
            target="_blank"
            rel="noreferrer"
          >
            <div className="social-div">
              <SiTwitter size={36} />
            </div>
          </a>
          <a
            href="https://twitter.com/ManasMG24"
            target="_blank"
            rel="noreferrer"
          >
            <div className="social-div">
              <SiDiscord size={36} />
            </div>
          </a>
          <a
            href="https://twitter.com/ManasMG24"
            target="_blank"
            rel="noreferrer"
          >
            <div className="social-div">
              <SiInstagram size={36} />
            </div>
          </a>
          <a
            href="https://twitter.com/ManasMG24"
            target="_blank"
            rel="noreferrer"
          >
            <div className="social-div">
              <SiFacebook size={36} />
            </div>
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
