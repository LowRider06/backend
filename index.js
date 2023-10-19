const express = require('express')
const app = express()
const cors = require('cors')

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(cors())
app.use(express.json())
app.use(requestLogger)
app.use(express.static('build'))

/// begin mongoose

const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url =
  //`mongodb+srv://fullstack:${password}@cluster0.o1opl.mongodb.net/?retryWrites=true&w=majority`
  `mongodb+srv://spc:${password}@cluster0.yoert.mongodb.net/?retryWrites=true&w=majority`
mongoose.set('strictQuery', false)
mongoose.connect(url)

const phoneBookSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true
  },
  number: {
    type: String,
    validate: {
      validator: function (v) {
        //return /\d{3}-\d{3}-\d{4}/.test(v)
        return /\d{2,3}-\d{7}/.test(v)
      },
      message: props => `${props.value} is not a valid phone number!`
    },
    required: [true, 'User phone number required']
  }
})

const Person = mongoose.model('Phonebook', phoneBookSchema)

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    console.log('persons ', persons)
    response.json(persons)
  })
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})


app.get('/api/persons/:id', (request, response) => {
  console.log('foo app.get = ', request.params.id)
  Person.findById(String(request.params.id))
    .then(person => {
      if (person) {
        console.log('foo app.get person, = ', person)
        response.json(person)
      } else {
        console.log('foo could not find person with id = ', request.params.id)
        response.status(404).end()
      }
    })
    .catch(error => {
      console.log(error)
      response.status(400).send({ error: 'malformatted id' })
    })
})

app.post('/api/persons', (request, response, next) => {
  console.log('foo got into post persons')
  const body = request.body
  console.log('request body.name === ', body.name)
  if (body.name === undefined || body.name === '') {
    console.log('got into body.name === undefined')
    return response.status(400).json({ error: 'name missing' })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
    .catch(error => next(error))

})

/*
  begin error handling
*/
const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  console.log('foo got into errorHandler')
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    console.log('foo got into error.name validation error', error.name)
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}


app.use(unknownEndpoint)
app.use(errorHandler)
/*
  end error handling
*/

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})


/*
const person = new Person({
  name: 'Abraham',
  number: '12345'
})

person.save().then(result => {
  console.log('person saved!')
  mongoose.connection.close()
})
*/