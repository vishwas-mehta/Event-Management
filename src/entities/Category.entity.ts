import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Event } from './Event.entity';

@Entity('categories')
export class Category{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    name: string;

    @Column({type: 'text', nullable:true})
    description: string;

    @Column({ nullable: true})
    icon:string;

    @OneToMany(() => Event, (event) => event.category)
    events: Event[];

    @CreateDateColumn({ name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at'})
    updatedAt: Date;
}