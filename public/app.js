window.addEventListener('load', async () => {
  // Check if MetaMask is installed
  if (typeof window.ethereum !== 'undefined') {
    // Create a Web3 instance
    window.web3 = new Web3(window.ethereum);
    console.log('MetaMask is installed!');
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      alert('User denied account access');
      return;
    }
  } else {
    alert('MetaMask is not installed. Please install MetaMask to use this feature.');
    return;
  }

  // Fetch contract info from the server
  const contractInfoResponse = await fetch('/api/contract-info');
  const contractInfo = await contractInfoResponse.json();
  document.getElementById('contract-address').innerText = contractInfo.address;
  document.getElementById('contract-owner').innerText = contractInfo.owner;

  // Update contract balance
  const updateBalance = async () => {
    const balanceResponse = await fetch('/api/balance');
    const balanceData = await balanceResponse.json();
    document.getElementById('contract-balance').innerText = balanceData.balance;
  };
  await updateBalance();

  // Pay button event listener
  document.getElementById('pay-button').addEventListener('click', async () => {
    const amountEth = document.getElementById('payment-amount').value;
    if (!amountEth || isNaN(amountEth) || Number(amountEth) <= 0) {
      alert('Please enter a valid amount in ETH');
      return;
    }
    
    const amountWei = web3.utils.toWei(amountEth, 'ether');
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const txParams = {
        from: accounts[0],
        to: contractInfo.address,
        value: web3.utils.toHex(amountWei)
      };
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      alert('Transaction sent! TxHash: ' + txHash);
    } catch (error) {
      console.error(error);
      alert('Transaction failed: ' + error.message);
    }
  });
});
