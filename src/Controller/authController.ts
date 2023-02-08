import { RequestHandler,Request,Response, request } from 'express'
import mssql from 'mssql'
import {v4 as uid} from 'uuid'
import { sqlConfig } from '../Config'
import { LoginSchema, RegistrationSchema } from '../Helpers'
import { DecodedData, User } from '../Models'
import Bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import path from 'path'
import jwt from 'jsonwebtoken'
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

interface ExtendedRequest extends Request{
    body:{Name:string ,Email:string,Password:string, ConfirmPassword:string}
    info?:DecodedData
}
export async function RegisterUser(req:ExtendedRequest, res:Response){
try {
    const id =uid()
    const{Name,Email,Password,ConfirmPassword} = req.body
    const {error} =RegistrationSchema.validate(req.body)
    if(error){
        return res.status(422).json(error.details[0].message)
    }
    const pool = await mssql.connect(sqlConfig)
    const hashedPassword= await Bcrypt.hash(Password,10)
    ///check if email exist
    await pool.request()
    .input('id',id)
    .input('name',Name)
    .input('email',Email)
    .input('password',hashedPassword)
    .execute('RegisterUser')
    return res.status(201).json({message:'User registered'})

} 
catch (error) {
     res.status(500).json(error) 
}
}


export async function loginUser(req:ExtendedRequest, res:Response){
try {
    const{Email,Password} = req.body
    const {error} =LoginSchema.validate(req.body)
    if(error){
        return res.status(422).json(error.details[0].message)
    }
     const pool = await mssql.connect(sqlConfig)
    const user:User[]= await (await pool.request()
    .input('email', Email). execute('getUserByEmail')).recordset
        if(!user[0]){
         return res.status(404).json({error:'User Not found'})
        }
    const valid= await Bcrypt.compare(Password, user[0].Password)
    if(!valid){
        return res.status(404).json({error:'User Not found'})
    }

    const payload= user.map(item=>{
        const {Password,...rest}=item
        return rest
    })
    const token = jwt.sign(payload[0], process.env.SECRETKEY as string , {expiresIn:'3600s'})
    return res.status(200).json({message:'User Loggedin!!!', token})

} catch (error) {
    res.status(500).json(error) 
}
}


export async function Homepage(req:ExtendedRequest,res:Response) {
    try {
      if(req.info){
        return res.status(200).json(`Welcome ${req.info.Name}`)
      }  
    } catch (error) {
        
    }
}