// @ts-nocheck
// 使い方: node show-types.mjs <file.ts> [型名...]
// ファイル内の type エイリアスを解決済みの型で表示する。型名を渡すとそれだけ表示。
import ts from 'typescript'
import path from 'node:path'

const [file, ...only] = process.argv.slice(2)
if (!file) { console.error('usage: node show-types.mjs <file.ts> [TypeName...]'); process.exit(1) }

const cfgPath = ts.findConfigFile(path.dirname(path.resolve(file)), ts.sys.fileExists, 'tsconfig.json')
const cfg = cfgPath
  ? ts.parseJsonConfigFileContent(ts.readConfigFile(cfgPath, ts.sys.readFile).config, ts.sys, path.dirname(cfgPath))
  : { options: { strict: true } }
const program = ts.createProgram([path.resolve(file)], cfg.options)
const checker = program.getTypeChecker()
const sf = program.getSourceFile(path.resolve(file))
const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias

ts.forEachChild(sf, node => {
  if (!ts.isTypeAliasDeclaration(node)) return
  const name = node.name.text
  if (only.length && !only.includes(name)) return
  if (node.typeParameters) return // ジェネリックは引数がないと解決できないので飛ばす
  const type = checker.getTypeAtLocation(node.name)
  console.log(`${name} = ${checker.typeToString(type, node, flags)}`)
})
