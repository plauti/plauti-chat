const { Tool } = require('langchain/tools');
const { z } = require('zod');
const { getEnvironmentVariable } = require('@langchain/core/utils/env');

class PlautiSupportSearch extends Tool {
  static lc_name() {
    return 'plauti_support_search';
  }

  constructor({ baseUrl, apiKey }) {
    super();
    this.name = "plauti_support_search";
    this.description = `
      Search the Plauti Support knowledge base for relevant articles.
      Input must be a JSON object with a { query } field.
      The query is a search term or phrase to look for in the knowledge base.
      Example input: { "query": "how to merge data" }.
      Returns a list of matching article titles and URLs.
    `;
    this.baseUrl = getEnvironmentVariable('HELPJUICE_URL');
    this.apiKey = getEnvironmentVariable('HELPJUICE_KEY');
  }

  // Zod schema for validating input
  schema = z.object({
    query: z.string().describe('The search term to look for in the Plauti Support knowledge base. Example: "how to merge data"'),
  });

  async _call({ query }) {
    try {
      if (!query) {
        throw new Error("Input must include a query string.");
      }

      // Fetch data from the Plauti Support knowledge base
      const response = await fetch(`${this.baseUrl}/api/v3/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching Plauti Support data: ${response.status}`);
      }

      const data = await response.json();

      // Process and return results
      if (data.length === 0) {
        return "No matching articles found.";
      }

      // Return a list of titles and links
      return data.map(article => `${article.title}: ${article.url}`).join('\n');
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}

module.exports = PlautiSupportSearch;