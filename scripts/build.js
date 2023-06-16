const copy = require("copy")
const copydirectory = require("copydirectory")
const { zip } = require("zip-a-folder")
const { join } = require("path")
const { mkdirSync } = require("fs")

/** 基于 process.cwd() 路径 */
const dirs = ["./public"]
const files = [".npmrc", ".yarnrc", "yarn.lock", "package.json", "ecosystem.config.js"]

async function run() {
    await copyFile(files.map(path => join(process.cwd(), path)), join(process.cwd(), "./dist"))
    dirs.forEach(path => copyDir(join(process.cwd(), path), join(process.cwd(), "./dist", path)))

    await zip(join(process.cwd(), "./dist"), join(process.cwd(), "./dist.zip"))
}

function copyFile(path, target) {
    return new Promise((res, rej) => {
        copy(path, target, (err, files) => {
            err ? rej(err) : res(files)
        })
    })
}

function copyDir(path, target) {
    try {
        mkdirSync(target)
    } catch {

    }

    copydirectory.copyDirSync(path, target)
}

run()
