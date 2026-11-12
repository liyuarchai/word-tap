import { Children, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { splitWords } from '../../domain/text'
import styles from '../../styles/app.module.css'

function WordText({
  text,
  activeWord,
  onWord
}: {
  text: string
  activeWord?: string
  onWord: (word: string) => void
}) {
  return (
    <>
      {splitWords(text).map((token, index) =>
        token.word ? (
          <button
            key={`${token.text}-${index}`}
            className={`${styles.wordButton} ${
              activeWord?.toLowerCase() === token.word.toLowerCase() ? styles.selectedWord : ''
            }`}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onWord(token.word!)
            }}
          >
            {token.text}
          </button>
        ) : (
          token.text
        )
      )}
    </>
  )
}

export function MarkdownBlock({
  markdown,
  activeWord,
  onWord,
  plain = false
}: {
  markdown: string
  activeWord?: string
  onWord: (word: string) => void
  plain?: boolean
}) {
  if (plain) {
    return (
      <div className={styles.segmentText}>
        <WordText text={markdown} activeWord={activeWord} onWord={onWord} />
      </div>
    )
  }

  const mapChildren = (children: ReactNode) =>
    Children.map(children, (child) =>
      typeof child === 'string' ? (
        <WordText text={child} activeWord={activeWord} onWord={onWord} />
      ) : (
        child
      )
    )

  return (
    <div className={`${styles.segmentText} ${styles.markdownBody}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ children, ...props }) => <p {...props}>{mapChildren(children)}</p>,
          strong: ({ children, ...props }) => <strong {...props}>{mapChildren(children)}</strong>,
          em: ({ children, ...props }) => <em {...props}>{mapChildren(children)}</em>,
          li: ({ children, ...props }) => <li {...props}>{mapChildren(children)}</li>,
          h1: ({ children, ...props }) => <h1 {...props}>{mapChildren(children)}</h1>,
          h2: ({ children, ...props }) => <h2 {...props}>{mapChildren(children)}</h2>,
          h3: ({ children, ...props }) => <h3 {...props}>{mapChildren(children)}</h3>,
          img: () => <span className={styles.muted}>[远程图片已隐藏]</span>,
          code: ({ children }) => <code>{children}</code>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          )
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

