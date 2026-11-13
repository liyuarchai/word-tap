import type { SentenceInput, WordExplainInput } from '../domain/types'

export interface AiPrompt {
  system: string
  user: string
}

export function buildContext(input: SentenceInput): string {
  return [
    input.contextBefore ? `前一句：${input.contextBefore}` : '',
    `当前句：${input.sentence}`,
    input.contextAfter ? `后一句：${input.contextAfter}` : ''
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildWordExplanationPrompt(
  input: WordExplainInput,
  options: { includeReviewQuestion?: boolean } = {}
): AiPrompt {
  return {
    system:
      `你是英语精读助手。结合上下文解释单词，用中文回答，例句保持简短。输出字段：contextMeaning、clue、example、exampleZh${
        options.includeReviewQuestion ? '、reviewQuestion' : ''
      }。${
        options.includeReviewQuestion
          ? 'reviewQuestion 必须是能检验该词在当前语境中含义的简短英文问题。'
          : ''
      }`,
    user: `单词：${input.word}\n原形：${input.lemma}\n${buildContext(input)}`
  }
}

export function buildTranslationPrompt(input: SentenceInput): AiPrompt {
  return {
    system: '你是英译中助手。只输出自然、准确的中文译文。输出字段：translation。',
    user: buildContext(input)
  }
}

export function buildAnalysisPrompt(input: SentenceInput): AiPrompt {
  return {
    system:
      '你是英语句法老师。用中文精炼分析句子。只返回一个 JSON 对象，不要 Markdown、解释或前后缀。必须使用模板：{"mainClause":"句子主干","logic":"逻辑与从句关系","phrases":"关键词组或搭配","hardPoints":"理解难点","naturalZh":"自然中文表达"}。所有字段都必须是字符串，内容不明确时返回空字符串。',
    user: buildContext(input)
  }
}

export function buildConnectionPrompt(): AiPrompt {
  return {
    system: '这是一个连接测试。只返回 JSON：{"ok":true}。',
    user: '连接测试'
  }
}
