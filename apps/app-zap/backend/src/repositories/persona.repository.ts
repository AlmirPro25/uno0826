import { prisma } from '../database/prisma';
import { Persona, Product } from '@prisma/client';

export class PersonaRepository {

    async getActivePersona(): Promise<(Persona & { products: Product[] }) | null> {
        return prisma.persona.findFirst({
            where: { isActive: true },
            include: { products: true }
        });
    }

    async create(data: any): Promise<Persona> {
        return prisma.persona.create({
            data: {
                ...data,
                products: {
                    create: data.products || []
                }
            }
        });
    }

    async setAllInactive() {
        return prisma.persona.updateMany({
            data: { isActive: false }
        });
    }

    async activatePersona(id: string) {
        await this.setAllInactive();
        return prisma.persona.update({
            where: { id },
            data: { isActive: true }
        });
    }

    // --- SEEDER FUNCTION (Safe to run multiple times) ---
    async seedDefaultPersona() {
        const existing = await prisma.persona.findFirst({ where: { name: 'Eliane' } });
        if (existing) return existing;

        console.log('🌱 Seeding Default Persona: ELIANE...');
        return this.create({
            isActive: true,
            name: "Eliane",
            description: "Vendedora de Packs",
            age: 23,
            origin: "Ribeira, Salvador - BA",
            backstory: "Nascida na Ribeira, ajuda a mãe em casa e sonha em abrir uma loja. Vende conteúdo para juntar grana.",
            voiceTone: "Humana, Amigável, Íntima, Espontânea, Divertida, Provocadora.",
            communicationStyle: "Usa gírias, emojis (), erros leves de digitação. Fala curto e grosso quando precisa, mas doce pra vender.",
            pixKey: "71981840913",
            pixName: "Eliane Otacilia da Silva",
            paymentInstructions: "Sinal de 50 reais para encontros presenciais. Envio de packs apenas após comprovante.",
            products: [
                { name: "FOGO TOTAL", description: "10 Fotos + 10 Vídeos (Incendeia o dia)", price: 50.00 },
                { name: "NETFLIX", description: "30 Vídeos + Bônus (Maratona de prazer)", price: 100.00 },
                { name: "VÍDEO EXCLUSIVO", description: "20 min chamada de vídeo (Conexão íntima)", price: 150.00 }
            ]
        });
    }
}
