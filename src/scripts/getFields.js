const mammoth = require('mammoth')
// const FileReader = require('filereader')
const fileType = require('file-type')
const path = require('path')
const fs = require('fs')

// This JS is intended to get the fields from all files in the local folder, and put them into local storage
// Should only be called once
// Utilizes the browser's local storage functionality to store persistant data

// const folderPath = '/Users/jasonliu/git/JanaTech/uploads'
const folderPath = 'C:/Users/dev/git/JanaTech/uploads'

let files = readFilesSync(folderPath)
// Use these to locate the fields afterwards
let docxIndices = []
let pdfIndices = []

window.localStorage.clear()

pushToStorage(files)
combineFields()

function combineFields () {
  let fields = []
  let docxIndices = window.localStorage.getItem('docxIndices')
  docxIndices = docxIndices.length > 1 ? docxIndices.split(',') : docxIndices.split()
  docxIndices.forEach(function (ind) {
    setTimeout(() => {
      fields.push(window.localStorage.getItem(ind.toString()))
    }, 200)
  })
  setTimeout(() => {
    if (fields.length > 1) {
      fields = [].concat.apply([], fields)
    } else {
      fields = fields[0].split(',')
    }
    fields = [...new Set(fields)]
    // console.log(fields)
    window.localStorage.setItem('fields', fields)
  }, 500)
}

// Puts in different array based on file extension
function pushToStorage (files) {
  for (let i = 0; i < files.length; i++) {
    if (fileType(files[i]) === undefined) {} else {
      if (fileType(files[i]).ext === 'docx') {
        docxIndices.push(i)
        fieldsDocx(files[i], i)
      } else if (fileType(files[i]).ext === 'pdf') {
        pdfIndices.push(i)
        // fieldsPdf(files[i], i)
      }
    }
  }
  // Setting to LocalStorage
  window.localStorage.setItem('docxIndices', docxIndices)
  window.localStorage.setItem('pdfIndices', pdfIndices)
}

// read all files in directory synchronously
function readFilesSync (dir) {
  const files = []
  fs.readdirSync(dir).forEach(filename => {
    files.push(fs.readFileSync(path.join(dir, filename)))
  })
  return files
}

// Converts to HTML
function fieldsDocx (file, id) {
  mammoth.convertToHtml(file)
    .then(function (result) {
      let names = []
      let fields = result.value.split('<p>')
      fields.forEach(function (field) {
        if ((field.match(/_/g) || []).length > 6) { // Looks for the __
          field = field.replace(/<[^>]*>/g, '')
          let words = field.split(/\b(\s)/)
          words = words.filter(v => v !== '') // Trims empty strings
          for (let i = 0; i < words.length; i++) {
            if (words[i].includes(':')) {
              words[i] = words[i].split(':')[0]
            }
            let char = '_'
            let same = true
            for (let j = 0; j < words[i].length; j++) {
              if (words[i][j] !== char) {
                same = false
              }
            }
            if (same === false) {
              let start = 0
              let end = 0
              for (let j = 0; j < words[i].length; j++) {
                if (words[i][j] !== char) {
                  start = j
                  break
                }
              }
              for (let k = start; k < words[i].length; k++) {
                if (words[i][k] === char) {
                  end = k
                  break
                }
              }
              if (start !== end) {
                words.splice(i, 1)
                words.push(words[i].substring(start, end + 1))
                console.log(words[i].substring(start, end + 1))
              }
            }
            // console.log(words)
          }     
          let fieldNames = fieldSearch(words)
          // fieldNames = fieldNames.map(f => f.trim())
          // console.log(fieldNames)
          fieldNames.forEach(function (element) {
            names.push(element) // Stores fields in an array
          })
        }
      })
      console.log(names)
      window.localStorage.setItem(id, names)
    })
  // return fields
}

// function fieldsPdf (file, id) {

// }

// Pushes fields into an array
function fieldSearch (words) {
  let fieldNames = []
  let nextStart = 0
  for (let i = 0; i < words.length; i++) {
    if (words[i].includes('_')) {
      let fieldName = ''
      for (let j = nextStart; j < i; j++) {
        // console.log(words[j], j)
        fieldName += words[j]
      }
      fieldNames.push(fieldName)
      nextStart = i + 1
    }
  }
  return fieldNames
}
