require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const PORT = process.env.PORT || 3000;

const GIST_ID = process.env.gist_id;
const GH_TOKEN = process.env.gist;

const GITHUB_API = axios.create({
	baseURL: "https://api.github.com",
	headers: {
		Authorization: `Bearer ${GH_TOKEN}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28"
	}
});

app.get("/", async (req, res) => {
	try {
		const { data } = await GITHUB_API.get(`/gists/${GIST_ID}`);
		const files = data.files;

		let output = "";
		if (files["template.txt"]) {
			output = files["template.txt"].content;
		}

		Object.keys(files).forEach((fileName) => {
			if (fileName !== "template.txt") {
				output += `\n${files[fileName].content}\n\n`;
			}
		});

		res.type("text/plain");
		res.send(output);
	} catch (error) {
		console.error("Failed to fetch Gist:", error.message);
		res.status(500).send("Failed to read Gist content");
	}
});

app.post("/add", async (req, res) => {
	const { category, data: inputData } = req.body;
	const fileName = `${category}.txt`;

	try {
		const { data: gistData } = await GITHUB_API.get(`/gists/${GIST_ID}`);
		
		// 1. Collect all existing domains from all files in the Gist to prevent cross-file duplicates
		const allExistingDomains = new Set();
		Object.values(gistData.files).forEach(f => {
			if (!f.content) return;
			const lines = f.content.split("\n");
			lines.forEach(line => {
				// Match lines starting with 127.0.0.1 followed by a domain
				const match = line.match(/^127\.0\.0\.1\s+(.+)$/);
				if (match) {
					allExistingDomains.add(match[1].trim().toLowerCase());
				}
			});
		});

		const file = gistData.files[fileName];
		if (!file) {
			return res.status(404).send("Category not found in Gist");
		}

		const domains = inputData
			.split(/[\n,]/)
			.map(d => d.trim().toLowerCase())
			.filter(Boolean);

		// 2. Filter out domains that already exist (checking both clean and www versions)
		const newBlocks = [];
		const skipped = [];

		for (const domain of domains) {
			const clean = domain.replace(/^www\./, "");
			const nonWww = clean;
			const withWww = `www.${clean}`;

			if (allExistingDomains.has(nonWww) || allExistingDomains.has(withWww)) {
				skipped.push(clean);
				continue;
			}

			newBlocks.push([
				`127.0.0.1 ${nonWww}`,
				`127.0.0.1 ${withWww}`
			]);
			
			// Add to set to prevent duplicates within the same submission
			allExistingDomains.add(nonWww);
			allExistingDomains.add(withWww);
		}

		if (newBlocks.length === 0) {
			return res.send(`No new domains added. All provided domains already exist in the Gist.`);
		}

		let content = file.content;
		const sfile = content.split("\n\n");
		
		if (sfile.length < 2) {
			sfile[1] = "";
		}

		for (let b of newBlocks) {
			if (sfile[0] && !sfile[0].endsWith('\n')) {
				sfile[0] += "\n"
			}
			if (sfile[1] && !sfile[1].endsWith('\n')) {
				sfile[1] += "\n"
			}
			sfile[0] += `${b[0]}\n`
			sfile[1] += `${b[1]}\n`
		}
		
		const updatedContent = sfile.join("\n\n");

		await GITHUB_API.patch(`/gists/${GIST_ID}`, {
			files: {
				[fileName]: {
					content: updatedContent
				}
			}
		});

		let responseMsg = `Successfully added ${newBlocks.length} new domains.`;
		if (skipped.length > 0) {
			responseMsg += ` Skipped ${skipped.length} existing domains.`;
		}
		res.send(responseMsg);
	} catch (error) {
		console.error("Failed to update Gist:", error.message);
		res.status(500).send("Failed to update Gist");
	}
});

app.get("/add", async (req, res) => {
	try {
		const { data: gistData } = await GITHUB_API.get(`/gists/${GIST_ID}`);
		const files = Object.keys(gistData.files);

		const options = files
			.filter(f => !f.includes("template"))
			.map(f => {
				const name = path.parse(f).name;
				return `<option value="${name}">${name}</option>`;
			})
			.join("");

		let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
		html = html.replace("{{OPTIONS}}", options);

		res.send(html);
	} catch (error) {
		console.error("Failed to fetch Gist for options:", error.message);
		res.status(500).send("Failed to load options");
	}
});

app.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});

