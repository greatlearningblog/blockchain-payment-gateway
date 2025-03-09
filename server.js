require('dotenv').config();
const express = require('express');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Initialize web3 using the provider URL from the .env file
const web3 = new Web3(process.env.WEB3_PROVIDER_URL);

// Load contract ABI
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'contracts', 'PaymentGatewayABI.json'), 'utf8'));

// Retrieve contract address from environment variables
const contractAddress = process.env.CONTRACT_ADDRESS;
const paymentContract = new web3.eth.Contract(contractABI, contractAddress);

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// API endpoint to get basic contract info
app.get('/api/contract-info', async (req, res) => {
  try {
    const owner = await paymentContract.methods.owner().call();
    res.json({ owner, address: contractAddress });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// API endpoint to get the contract balance in ETH
app.get('/api/balance', async (req, res) => {
  try {
    const balance = await web3.eth.getBalance(contractAddress);
    res.json({ balance: web3.utils.fromWei(balance, 'ether') });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// (Optional) API endpoint to trigger a withdrawal
// WARNING: In production, secure this endpoint and do not expose private keys.
app.post('/api/withdraw', async (req, res) => {
  const { amount, account, privateKey } = req.body;
  try {
    const nonce = await web3.eth.getTransactionCount(account, 'latest');
    const tx = {
      from: account,
      to: contractAddress,
      nonce: nonce,
      gas: 200000,
      data: paymentContract.methods.withdraw(web3.utils.toWei(amount, 'ether')).encodeABI()
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    res.json({ receipt });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// Listen for PaymentReceived events and log them
paymentContract.events.PaymentReceived({ fromBlock: 'latest' }, (error, event) => {
  if (error) {
    console.error('Error on event:', error);
  } else {
    console.log('PaymentReceived event:', event.returnValues);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
