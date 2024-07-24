const { BlobServiceClient } = require("@azure/storage-blob");

const accountName = process.env.AZURE_STORAGE_ACCOUNT;
const sasToken = process.env.AZURE_SAS_TOKEN;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

if (!accountName || !sasToken || !containerName) {
  throw new Error(
    "Azure Storage account, SAS token, or container name is missing"
  );
}

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net/?${sasToken}`
);

const uploadImageToAzure = async (buffer, fileName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadData(buffer);
  return blockBlobClient.url;
};

module.exports = {
  uploadImageToAzure,
};


