const copy = require("copy")
const copydirectory = require("copydirectory")
const { join } = require("path")
const { mkdirSync } = require("fs")

/** 基于 process.cwd() 路径 */
const dirs = ["./public"]
const files = [".npmrc", ".yarnrc", "yarn.lock", "package.json", "ecosystem.config.js"]

async function run() {
    await copyFile(files.map(path => join(process.cwd(), path)), join(process.cwd(), "./dist"))
    dirs.forEach(path => copyDir(join(process.cwd(), path), join(process.cwd(), "./dist", path)))
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
