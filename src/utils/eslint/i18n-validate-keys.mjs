import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load i18n files
function loadI18nKeys() {
  const i18nDir = join(__dirname, "../../i18n")
  const locales = ["en_US", "zh_CN"]
  const allKeys = new Set()

  for (const locale of locales) {
    try {
      const filePath = join(i18nDir, `${locale}.json`)
      const content = readFileSync(filePath, "utf-8")
      const json = JSON.parse(content)
      const keys = Object.keys(json)
      keys.forEach((key) => allKeys.add(key))
    } catch (error) {
      console.warn(`Warning: Could not load i18n file for ${locale}:`, error.message)
    }
  }

  return allKeys
}

// Extract i18n key from AST node
function getI18nKey(node) {
  if (node.type === "MemberExpression") {
    // Match pattern: plugin.i18n.dockTitle or anything.i18n.keyName
    if (
      node.property &&
      node.object?.type === "MemberExpression" &&
      node.object.property?.name === "i18n"
    ) {
      // Get the property name (the key being accessed multilingual)
      if (node.property.type === "Identifier") {
        return node.property.name
      }
      if (node.property.type === "Literal") {
        return node.property.value
      }
    }
  }
  return null
}

export default {
  rules: {
    missingKey: {
      meta: {
        type: "problem",
        docs: {
          description: "Validate that i18n keys used in code exist in i18n JSON files",
        },
        messages: {
          missingKey: "i18n key '{{key}}' does not exist in i18n files",
        },
        schema: [],
      },
      create(context) {
        const availableKeys = loadI18nKeys()

        return {
          MemberExpression(node) {
            const key = getI18nKey(node)
            if (key && !availableKeys.has(key)) {
              context.report({
                node,
                messageId: "missingKey",
                data: { key },
              })
            }
          },
        }
      },
    },
  },
}
