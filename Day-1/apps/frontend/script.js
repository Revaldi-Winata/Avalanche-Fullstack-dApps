const connectBtn = document.getElementById("connectBtn");
const statusEl = document.getElementById("status");
const addressEl = document.getElementById("address");
const networkEl = document.getElementById("network");
const balanceEl = document.getElementById("balance");
const errorEl = document.getElementById("error");
const identityEl = document.getElementById("identity");
const identityNameEl = document.getElementById("identityName");
const identityNimEl = document.getElementById("identityNim");

// Avalanche Fuji Testnet chainId (hex)
const AVALANCHE_FUJI_CHAIN_ID = "0xa869";
const CONNECTED_COLOR = "#4cd137";
const WARNING_COLOR = "#fbc531";
const ERROR_COLOR = "#e74c3c";
const OWNER_ADDRESS = "0x3123d6a81934d1daa132136c5467d328beb6a3ad";
const OWNER_NAME = "Revaldi Winata";
const OWNER_NIM = "231011401910";

let currentAddress = null;

function formatAvaxBalance(balanceWei) {
  const balance = parseInt(balanceWei, 16);
  return (balance / 1e18).toFixed(4);
}

function shortenAddress(address) {
  if (!address) {
    return "-";
  }

  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function setStatus(text, color) {
  statusEl.textContent = text;
  statusEl.style.color = color || "";
}

function setError(message) {
  if (!errorEl) {
    return;
  }

  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }
}

function setButtonState({ disabled, label }) {
  connectBtn.disabled = disabled;
  if (label) {
    connectBtn.textContent = label;
  }
}

function updateIdentity(address) {
  if (!identityEl || !identityNameEl || !identityNimEl) {
    return;
  }

  if (!address) {
    identityEl.hidden = true;
    return;
  }

  if (address.toLowerCase() === OWNER_ADDRESS) {
    identityNameEl.textContent = OWNER_NAME;
    identityNimEl.textContent = OWNER_NIM;
    identityEl.hidden = false;
  } else {
    identityEl.hidden = true;
  }
}

function setDisconnected(message) {
  currentAddress = null;
  addressEl.textContent = "-";
  addressEl.removeAttribute("title");
  networkEl.textContent = "-";
  balanceEl.textContent = "-";
  setStatus("Not Connected");
  setButtonState({ disabled: false, label: "Connect Wallet" });
  setError(message || "");
  updateIdentity(null);
}

function setConnected(address) {
  currentAddress = address;
  addressEl.textContent = shortenAddress(address);
  addressEl.title = address;
  setButtonState({ disabled: false, label: "Disconnect" });
  setError("");
  updateIdentity(address);
}

async function refreshWalletData(address) {
  if (!address) {
    setDisconnected();
    return;
  }

  setConnected(address);

  const chainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  if (chainId === AVALANCHE_FUJI_CHAIN_ID) {
    networkEl.textContent = "Avalanche Fuji Testnet";
    setStatus("Connected", CONNECTED_COLOR);

    const balanceWei = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });

    balanceEl.textContent = formatAvaxBalance(balanceWei);
    return;
  }

  networkEl.textContent = "Wrong Network";
  balanceEl.textContent = "-";
  setStatus("Please switch to Avalanche Fuji", WARNING_COLOR);
  setError("Network tidak sesuai. Silakan switch ke Avalanche Fuji Testnet.");
}

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    setDisconnected("Core Wallet tidak terdeteksi. Silakan install Core Wallet.");
    return;
  }

  try {
    setStatus("Connecting...");
    setError("");
    setButtonState({ disabled: true, label: "Connecting..." });

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      setDisconnected("Akun tidak tersedia.");
      return;
    }

    await refreshWalletData(accounts[0]);
    setButtonState({ disabled: false, label: "Disconnect" });
  } catch (error) {
    console.error(error);
    setStatus("Connection Failed", ERROR_COLOR);
    setButtonState({ disabled: false, label: "Connect Wallet" });
    setError("Connection failed. Silakan coba lagi.");
  }
}

function disconnectWallet() {
  setDisconnected("Wallet disconnected.");
}

function handleAccountsChanged(accounts) {
  if (!accounts || accounts.length === 0) {
    setDisconnected("Wallet disconnected.");
    return;
  }

  refreshWalletData(accounts[0]).catch((error) => {
    console.error(error);
    setError("Gagal memuat data wallet.");
  });
}

function handleChainChanged() {
  if (!currentAddress) {
    return;
  }

  refreshWalletData(currentAddress).catch((error) => {
    console.error(error);
    setError("Gagal memuat data network.");
  });
}

connectBtn.addEventListener("click", () => {
  if (currentAddress) {
    disconnectWallet();
    return;
  }

  connectWallet();
});

if (window.ethereum) {
  window.ethereum.on("accountsChanged", handleAccountsChanged);
  window.ethereum.on("chainChanged", handleChainChanged);
}
