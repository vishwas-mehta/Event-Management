import { DataSource } from "typeorm";
import dotenv from "dotenv";
import env from "./env";

import { User } from "../entities/User.entity";
import { Event } from "../entities/Event.entity";
import { Category } from "../entities/Category.entity";
import { TicketType } from "../entities/TicketType.entity";
import { Booking } from "../entities/Booking.entity";
import { Review } from "../entities/Review.entity";
import {Waitlist } from "../entities/Waitlist.entity";
import { ReportedEvent } from "../entities/ReportedEvent.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: env.database.host,
    port: env.database.port,
    username: env.database.username,
    password: env.database.password,
    database: env.database.database,
    synchronize: env.database.synchronize,
    logging: false,
    entities: [User, Event, Category, TicketType, Booking, Review, Waitlist, ReportedEvent],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: [],
});

export const initializeDatabase = async () : Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
    } catch (err) {
        console.error("Error during Data Source initialization:", err);
        process.exit(1);
    }

};