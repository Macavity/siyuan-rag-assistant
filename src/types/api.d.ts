interface IResGetNotebookConf {
  box: string
  conf: NotebookConf
  name: string
}

interface IReslsNotebooks {
  notebooks: Notebook[]
}

interface IResUpload {
  errFiles: string[]
  succMap: { [key: string]: string }
}

interface IResdoOperations {
  doOperations: doOperation[]
  undoOperations: doOperation[] | null
}

interface IResGetBlockKramdown {
  id: BlockId
  kramdown: string
}

interface IResGetChildBlock {
  id: BlockId
  type: BlockType
  subtype?: BlockSubType
}

interface IResGetTemplates {
  content: string
  path: string
}

interface IResReadDir {
  isDir: boolean
  isSymlink: boolean
  name: string
}

interface IResExportMdContent {
  hPath: string
  content: string
}

interface IResBootProgress {
  progress: number
  details: string
}

interface IResForwardProxy {
  body: string
  contentType: string
  elapsed: number
  headers: { [key: string]: string }
  status: number
  url: string
}

interface IResExportResources {
  path: string
}

interface IResListDocsByPath {
  box: string
  path: string
  files: Array<{
    path: string
    name: string
    id: string
    icon?: string
    name1?: string
    alias?: string
    memo?: string
    bookmark?: string
    count?: number
    size?: number
    hSize?: string
    mtime?: number
    ctime?: number
    hMtime?: string
    hCtime?: string
    sort?: number
    subFileCount?: number
    hidden?: boolean
    newFlashcardCount?: number
    dueFlashcardCount?: number
    flashcardCount?: number
  }>
}
