import express, { json } from 'express'
import router from './Router'
import authrouter from './Router/authRoutes'

const app= express()

//Register some Middlewares

app.use(json()) //adds a body to the Request


app.use('/flights', router)
app.use('/auth',authrouter)


app.listen(4000,()=>{
console.log("Running ...");

})