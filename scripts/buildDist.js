const { zip } = require("zip-a-folder")
const { join } = require("path")

async function run() {
    await zip(join(process.cwd(), "./dist"), join(process.cwd(), "./dist.zip"))
}

run()