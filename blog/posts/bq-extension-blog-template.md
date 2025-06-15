# BigQuery Explorer: Actually Useful Scheduled Query Tracking

*[Write about your actual daily workflow - why existing extensions sucked for scheduled queries]*

## What I Built

### Scheduled Query History That Doesn't Suck
*[Most BigQuery extensions ignore scheduled queries entirely - explain why this was annoying]*

Direct integration with BigQuery's job API to pull actual execution details:

```typescript
async function getBigQueryJobDetails(projectId, jobId) {
  const bigquery = new BigQuery({ projectId });
  const [job] = await bigquery.job(jobId).get();
  const [metadata] = await job.getMetadata();
  
  return {
    jobId: job.id,
    statistics: metadata.statistics,
    configuration: metadata.configuration
  };
}
```

The extension hooks into Data Transfer Service runs and correlates them with actual BigQuery jobs:

```typescript
// Get query from configuration if available
if (jobDetails.configuration?.query) {
  console.log(`Query: ${jobDetails.configuration.query.query}`);
  
  // Get destination table if available
  if (jobDetails.configuration.query.destinationTable) {
    const table = jobDetails.configuration.query.destinationTable;
    console.log(`Destination: ${table.projectId}.${table.datasetId}.${table.tableId}`);
  }
}
```

*[Talk about the UI - the screenshots show the actual execution history]*
*[Explain why this matters for your daily work]*

### BigQuery Client That Actually Performs
*[The original was making too many API calls]*

Rewrote the core client to batch requests properly:

```typescript
const client: Client = {
  async getDatasets() {
    const [datasets] = await bigQuery.getDatasets({
      maxResults: 1000, // Actually request reasonable chunks
    });
    return datasets.map((dataset) => dataset.metadata.datasetReference);
  },

  async getTables({ datasetId }) {
    const [tables] = await bigQuery.dataset(datasetId).getTables({
      maxResults: 1000, // No more pagination hell
    });
    return tables.map((table) => table.metadata.tableReference);
  },

  async getFields(ref) {
    const [metadata] = await bigQuery
      .dataset(ref.datasetId)
      .table(ref.tableId)
      .getMetadata({
        maxResults: 10000, // Get all schema info at once
      });
    return walk(metadata.schema.fields, ref, []);
  }
};
```

### Query Error Messages That Help
*[BigQuery errors are cryptic enough without making them worse]*

Added proper error parsing with line numbers and suggestions:

```typescript
const rSuggestion = /^Unrecognized name: (.+?); Did you mean (.+?)\?$/;
const rSuggestionResult = rSuggestion.exec(errorMessage);

if (rSuggestionResult) {
  const [, before, after] = rSuggestionResult;
  return {
    type: "QueryWithPosition" as const,
    reason: errorMessage,
    position: { line, character },
    suggestion: { before, after },
  };
}
```

### Renamed to Get on VS Code Marketplace
*[BigQuery Runner was taken, needed something new]*

"Explorer" actually fits better since it's more about browsing your BigQuery resources than just running queries.

## The Annoying Parts

**BigQuery API Rate Limits**: Google's APIs love to throttle you. Fixed with request batching and smart caching.

**Transfer Service Integration**: Multiple APIs, inconsistent data formats, lots of null checks.

**Nested Schema Types**: RECORD and STRUCT types in BigQuery schemas are a pain to parse recursively.

**Long-Running Jobs**: Tracking job status without hammering the API every second.

*[Built this mostly with AI assistance - lots of trial and error with BigQuery API quirks]*

## Next Steps

*[What BigQuery features you want to add next]*

---

*Forked from [minodisk/bigquery-runner](https://github.com/minodisk/bigquery-runner) because I needed scheduled query support.* 