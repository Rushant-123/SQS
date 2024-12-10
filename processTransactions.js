import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from 'dotenv';
dotenv.config();

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

async function getChartsOfAccounts(companyId) {
  // Mock data matching the actual MongoDB structure
  return [
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
      detailType: "Income",
      description: "Money you get from things like dividends, royalties, and capital gains.",
      balance: 0,
      userId: "UR411858",
      companyId: "CMP175269",
      parentCompany: "PC459645",
      accountKey: "C1301002",
      isUsed: true,
      transactionTypes: ["deposit"]
    }
  ];
}

async function processAllTransactions(newTransactions, companyId) {
  try {
    const chartsData = await getChartsOfAccounts(companyId);
    
    console.log('Original charts data:', JSON.stringify(chartsData, null, 2));
    
    if (!Array.isArray(chartsData)) {
      throw new Error('Charts data must be an array');
    }
    
    if (!chartsData.every(chart => 'accountKey' in chart)) {
      throw new Error('All charts must have accountKey property');
    }

    const payload = {
      body: newTransactions,
      charts_data: chartsData,
      collection_name: companyId,
      batch_id: `${companyId}_all`,
      company_desc: "Nyteco is built for the recycling industry...",
      additional_context: ""
    };

    console.log('Full payload before sending:', JSON.stringify(payload, null, 2));

    const command = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(payload),
      MessageGroupId: companyId,
      MessageDeduplicationId: `${companyId}-${Date.now()}`
    });

    const result = await sqsClient.send(command);
    console.log('Message sent to SQS with ID:', result.MessageId);

    return {
      successful: newTransactions,
      failed: [],
      totalProcessed: newTransactions.length,
      batch_ids: [`${companyId}_all`]
    };

  } catch (error) {
    console.error("Error in processAllTransactions:", error);
    throw error;
  }
}

export { processAllTransactions }; 