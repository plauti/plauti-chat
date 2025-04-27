const { Tool } = require('@langchain/core/tools');
const TurndownService = require('turndown');
const { z } = require('zod');
const cheerio = require('cheerio');
class FetchUrl extends Tool {
	static lc_name() {
		return 'fetchurl';
	}
	constructor() {
		super();
		this.name = "fetchurl";
		this.description = `
          Fetches the content of a public web page from a given HTTPS URL, converts the HTML to Markdown, and returns the text content as Markdown. 
          Input must be an object containing a { url } field with a valid, public HTTPS URL (e.g., "https://example.com"). 

          Do NOT provide URLs that are:
          - not HTTPS
          - local/internal (e.g., localhost, 127.0.0.1, private IPs)
          - suspected to be unsafe or not publicly accessible

          Returns only the converted main content of the web page in Markdown format, truncated for length if necessary.

          Example input:
          { "url": "https://en.wikipedia.org/wiki/OpenAI" }

          Example output:
          # OpenAI
          OpenAI is an American artificial intelligence research organization...
          `;
		this.schema = z.object({
			url: z.string()
				.url({
					message: 'Must be a valid URL.'
				})
				.startsWith('https://', {
					message: 'Only HTTPS URLs are allowed.'
				})
				.describe('A valid HTTPS URL to fetch, e.g. "https://example.com".')
		}).describe('Input object containing the HTTPS URL for the web page to fetch.');
	}
	/**
	 * @param {string} url (can add input validation here)
	 */
	async _call({url}) {
		try {
			// Validate URL
			if (!this.isValidUrl(url)) {
				throw new Error("Invalid or unsafe URL string -- ");
			}
			// Use fetch (Node 18+)
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Could not fetch url: ${response.status}`);
			const html = await response.text();
			
			// Parse HTML input
			const ct = cheerio.load(html);

			// Get text content and compact whitespace
			return ct('body').text().replace(/\s\s+/g, '\n').trim().slice(0,30000);
		}
		catch (e) {
			return `Error: ${e.message}`;
		}
	}
	isValidUrl(urlString) {
		try {

			const url = new URL(urlString);
			
			
			

			if (url.protocol !== 'https:') {
				return false;
			}
			const hostname = url.hostname;
			// Block localhost, 127.*, ::1, internal domains and private IP
			if (
				hostname === 'localhost' ||
				hostname === '127.0.0.1' ||
				hostname === '::1' ||
				hostname.endsWith('.local')
			) {
				return false;
			}
			// Optional: Block private IP ranges (10.*, 192.168.*, 172.[16-31].*)
			const ipBlocks = [
				/^10\./,
				/^192\.168\./,
				/^172\.(1[6-9]|2[0-9]|3[01])\./,
			];
			if (ipBlocks.some((regex) => regex.test(hostname))) {
				return false;
			}
			return true;
		}
		catch (err) {
			return false;
		}
	}
}
module.exports = FetchUrl;