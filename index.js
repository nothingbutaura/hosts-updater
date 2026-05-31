const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
	const blocksDir = path.join(__dirname, "blocks");

	fs.readdir(blocksDir, (err, files) => {
		if (err) {
			return res.status(500).send("Failed to read blocks folder");
		}

		let output = fs.readFileSync("blocks/template.txt", "utf8");

		files.forEach((file) => {
			const filePath = path.join(blocksDir, file);

			if (fs.statSync(filePath).isFile()) {
				const content = fs.readFileSync(filePath, "utf8");
				const name = path.parse(file).name;
				if (!name.includes("template")) {
					output += `\n${content}\n\n`;
				}
			}
		});

		res.type("text/plain");
		res.send(output);
	});
});

app.post("/add", (req, res) => {
	const { category, data } = req.body;

	const filePath = path.join(__dirname, "blocks", `${category}.txt`);

	const domains = data
		.split(/[\n,]/)
		.map(d => d.trim().toLowerCase())
		.filter(Boolean);

	const blocks = domains.map(domain => {
		const clean = domain.replace(/^www\./, "");
		return [
			`127.0.0.1 ${clean}`,
			`127.0.0.1 www.${clean}`
		]
	});

	let file = fs.readFileSync(filePath, "utf8")
	const sfile = file.split("\n\n")
	for (let b of blocks) {
		if (!sfile[0].endsWith('\n')) {
			sfile[0] += "\n"
		}
		if (!sfile[1].endsWith('\n')) {
			sfile[1] += "\n"
		}
		sfile[0] += `${b[0]}\n`
		sfile[1] += `${b[1]}\n`
	}
	file = sfile.join("\n")
	fs.writeFileSync(filePath, file, "utf-8")
	res.send("Data Addes successfully");
});

app.get("/add", (req, res) => {
	const blocksDir = path.join(__dirname, "blocks");
	const files = fs.readdirSync(blocksDir);

	const options = files
		.filter(f => fs.statSync(path.join(blocksDir, f)).isFile())
		.map(f => {
			const name = path.parse(f).name;
			if (!name.includes("template")) {
				return `<option value="${name}">${name}</option>`;
			}
			return "";
		})
		.join("");

	let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

	// inject options into placeholder
	html = html.replace("{{OPTIONS}}", options);

	res.send(html);
});

app.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});
