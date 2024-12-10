import { processAllTransactions } from './processTransactions.js';

// Test data matching the structure from getChartsOfAccounts
const testTransactions = [
  {
    _id: "tx1",
    amount: 100,
    description: "Staff welfare payment",
    type: "expense",
    date: new Date().toISOString(),
    status: "pending"
  },
  {
    _id: "tx2",
    amount: 200,
    description: "Training session payment",
    type: "expense",
    date: new Date().toISOString(),
    status: "pending"
  }
];

const testChartsData = [
  {
    _id: "6756156001b040074716dc58",
    code: null,
    Id: "127",
    Name: "Staff Welfare Expenses",
    accountType: "Expenses",
    detailType: "Supplies",
    description: null,
    balance: 0,
    userId: "UR411858",
    companyId: "CMP175269",
    parentCompany: "PC459645",
    accountKey: "C0716004",
    isUsed: true,
    transactionTypes: ["expense"]
  },
  {
    _id: "6756156001b040074716dc89",
    code: null,
    Id: "120",
    Name: "Training Expenses",
    accountType: "Expenses",
    detailType: "Cost of Labour",
    description: null,
    balance: 0,
    userId: "UR411858",
    companyId: "CMP175269",
    parentCompany: "PC459645",
    accountKey: "C0704003",
    isUsed: true,
    transactionTypes: ["expense"]
  },
  {
    _id: "6756156001b040074716dc92",
    code: null,
    Id: "48",
    Name: "4203. Other Portfolio Income",
    accountType: "Other Income",
    detailType: "Cost of Labour",
    description: null,
    balance: 0,
    userId: "UR411858",
    companyId: "CMP175269",
    parentCompany: "PC459645",
    accountKey: "C0704003",
    isUsed: true,
    transactionTypes: ["expense"]
  }
];

const testCompanyId = 'CMP720130';

// Run the test
async function runTest() {
  try {
    console.log('Starting test...');
    
    // Process transactions with the correct data structure
    const result = await processAllTransactions(testTransactions, testCompanyId);
    console.log('Processing result:', result);
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run test and log any errors
runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 