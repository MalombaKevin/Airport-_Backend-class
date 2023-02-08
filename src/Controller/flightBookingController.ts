import { RequestHandler,Request,Response } from 'express'
import mssql from 'mssql'
import {v4 as uid} from 'uuid'
import { sqlConfig } from '../Config'
import { bookingSchema } from '../Helpers'
import { Booking } from '../Models'

interface ExtendedRequest extends Request{
    body:{Name:string,Email:string,Destination:string, TravelDate:Date},
    params:{id:string}
}
//Get booking Details
export const getBookings:RequestHandler=async (req,res)=>{
   try {
     const pool= await mssql.connect(sqlConfig)
     const bookings:Booking[] = await (await pool.request().execute('getFlights')).recordset
     res.status(200).json(bookings)
   } catch (error) {
    res.status(500).json(error)
   }

}
//Get one booking
export const getOneBooking=async(req:ExtendedRequest,res:Response)=>{
try {
  const id = req.params.id
  const pool= await mssql.connect(sqlConfig)
  const booking:Booking= await (await pool.request()
  .input('id', id)
  .execute('getFlightBookings')
  ).recordset[0]

  if(!booking){
     res.status(404).json({error:'Booking Not Found'})
  }

  res.status(200).json(booking)

} catch (error) {
  res.status(500).json(error)
}

}
 export async function addBooking( req:ExtendedRequest, res:Response) {
  try {
    const id =uid()
    const {Name,Email,TravelDate,Destination}= req.body
    const{ error}=bookingSchema.validate(req.body)
    if(error){
      return res.status(422).json(error.details[0].message)
    }
    const pool= await mssql.connect(sqlConfig)
    await pool.request()
    .input('id',id)
    .input('name',Name)
    .input('email',Email)
    .input('destination',Destination)
    .input('date',TravelDate)
    .execute('InsertOrUpdate')

   return  res.status(201).json({message:'Booking Added'})
  } 
  catch (error:any) {
     return res.status(500).json(error.message)
  }
 }


//Update Booking


export async function updateBooking(req:ExtendedRequest,res:Response){
try {
const {Name,Email,TravelDate,Destination}= req.body
    const pool= await mssql.connect(sqlConfig)

  const booking:Booking= await (await pool.request()
  .input('id', req.params.id)
  .execute('getFlightBookings')
  ).recordset[0]

  if(booking){
    await pool.request()
    .input('id',req.params.id)
    .input('name',Name)
    .input('email',Email)
    .input('destination',Destination)
    .input('date',TravelDate)
    .execute('InsertOrUpdate')
    return res.status(200).json({message:'Updated'})
  }

  return res.status(404).json({error:'Booking Not Found'})    
  } 

catch (error:any) {
   res.status(500).json(error.message)
}
}


//delete


export const cancelBooking=async(req:ExtendedRequest, res:Response)=>{
  try {
   const pool= await mssql.connect(sqlConfig)

    const booking:Booking= await (await pool.request()
  .input('id', req.params.id)
  .execute('getFlightBookings')
  ).recordset[0]
    if(booking){
         await pool.request().input('id',req.params.id).execute('deleteFlightBookings')
        return res.status(200).json({message:'Deleted'})
    }
  return res.status(404).json({error:'Booking Not Found'})  
  } catch (error:any) {
    res.status(500).json(error.message)
  }
}