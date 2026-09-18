import { Module } from "@nestjs/common";

import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { MockPaymentProvider } from "./providers/mock-payment.provider";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    imports: [PrismaModule],
    controllers: [PaymentController],
    providers: [PaymentService, MockPaymentProvider],
    exports: [PaymentService],
})
export class PaymentModule { }
