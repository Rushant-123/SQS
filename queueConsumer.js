import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

console.log('Starting SQS consumer...');

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

async function processMessage(message) {
  try {
    console.log('Raw SQS message:', message.Body);
    const messageBody = JSON.parse(message.Body);
    
    console.log('After SQS - Full charts_data:', JSON.stringify(messageBody.charts_data, null, 2));
    
    // Validate the charts_data structure
    if (!Array.isArray(messageBody.charts_data)) {
      throw new Error('charts_data must be an array');
    }
    
    // Transform the charts data to match expected structure if needed
    const transformedChartsData = messageBody.charts_data.map(chart => {
      if (chart.accountKey) {
        return {
          accountKey: chart.accountKey,
          Name: chart.Name,
          accountType: chart.accountType,
          transactionTypes: chart.transactionTypes
        };
      }
      
      return {
        _id: chart.id?.toString(),
        accountKey: `C${chart.id?.toString().padStart(7, '0')}`,
        Name: chart.name || chart.Name,
        accountType: chart.accountType || "Expenses",
        transactionTypes: chart.transactionTypes || ["expense"]
      };
    });
    
    // Update the message body with transformed data
    messageBody.charts_data = transformedChartsData;
    
    console.log('Transformed charts data:', JSON.stringify(transformedChartsData, null, 2));
    
    try {
      // Process transactions using the categorize endpoint
      console.log('Making request to:', process.env.API_ENDPOINT);
      
      const response = await axios.post(process.env.API_ENDPOINT, messageBody, { 
        timeout: 600000,
        headers: {
          'x-api-key': process.env.API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lambda response:', response.data);
      return true;
    } catch (apiError) {
      console.error('API error details:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        headers: apiError.response?.headers,
        url: apiError.config?.url
      });
      
      if (apiError.response?.data?.error?.includes("Collection") && 
          apiError.response?.data?.error?.includes("does not exist")) {
        console.log('Collection does not exist, treating as success to remove from queue');
        return true;
      }
      throw apiError;
    }
  } catch (error) {
    if (error.response?.data) {
      console.error('Lambda error details:', error.response.data);
    }
    console.error('Error processing message:', error.message);
    throw error;
  }
}

async function deleteMessage(receiptHandle) {
  try {
    await sqsClient.send(new DeleteMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      ReceiptHandle: receiptHandle
    }));
    console.log('Message deleted successfully.');
  } catch (error) {
    console.error('Error deleting message:', error);
  }
}

async function pollQueue() {
  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All']
      });

      const response = await sqsClient.send(command);
      
      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          const success = await processMessage(message);
          if (success) {
            await deleteMessage(message.ReceiptHandle);
          }
        }
      }
    } catch (error) {
      console.error('Error polling queue:', error);
      // Wait before retrying on error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start the consumer
pollQueue().catch(error => {
  console.error('Fatal error in queue consumer:', error);
  process.exit(1);
}); 