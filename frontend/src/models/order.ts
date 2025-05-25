import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  orderId: string;
  items: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  subtotal: number;
  instructions?: string;
  address: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderDate: Date;
  deliveryDate: Date;
}

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true },
  items: [
    {
      id: String,
      title: String,
      price: Number,
      quantity: Number,
      image: String,
    },
  ],
  subtotal: Number,
  instructions: String,
  address: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  orderDate: Date,
  deliveryDate: Date,
});

export default mongoose.model<IOrder>("Order", OrderSchema);
