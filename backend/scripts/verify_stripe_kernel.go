package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/price"
)

func main() {
	// Carregar .env
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("⚠️  Aviso: .env não encontrado ou erro ao ler (tentando variáveis de ambiente globais)")
	}

	fmt.Println("🚀 KERNEL STRIPE VERIFICATION - PRE-FLIGHT CHECK")
	fmt.Println("================================================")

	secretKey := os.Getenv("KERNEL_STRIPE_SECRET_KEY")
	pricePro := os.Getenv("KERNEL_STRIPE_PRICE_PRO")
	priceEnterprise := os.Getenv("KERNEL_STRIPE_PRICE_ENTERPRISE")

	if secretKey == "" || secretKey == "sk_test_PLACEHOLDER" {
		fmt.Println("❌ ERRO: KERNEL_STRIPE_SECRET_KEY não configurada ou é placeholder.")
		fmt.Println("   Ação: Edite backend/.env e coloque sua chave SK_LIVE ou SK_TEST.")
		os.Exit(1)
	}

	stripe.Key = secretKey

	// Verificar Preço Pro
	if pricePro == "" {
		fmt.Println("❌ ERRO: KERNEL_STRIPE_PRICE_PRO não configurado.")
		fmt.Println("   Ação: Crie o plano 'Pro' no Stripe Dashboard e cole o ID (price_...) no .env")
	} else {
		fmt.Printf("🔍 Verificando Price Pro (%s)... ", pricePro)
		p, err := price.Get(pricePro, nil)
		if err != nil {
			fmt.Printf("FALHA ❌\n   Erro: %v\n", err)
		} else {
			fmt.Printf("OK ✅ (Produto: %s, Valor: %d %s)\n", p.Product.ID, p.UnitAmount, p.Currency)
		}
	}

	// Verificar Preço Enterprise
	if priceEnterprise == "" {
		fmt.Println("⚠️  AVISO: KERNEL_STRIPE_PRICE_ENTERPRISE não configurado (opcional se não vender Enterprise agora).")
	} else {
		fmt.Printf("🔍 Verificando Price Enterprise (%s)... ", priceEnterprise)
		p, err := price.Get(priceEnterprise, nil)
		if err != nil {
			fmt.Printf("FALHA ❌\n   Erro: %v\n", err)
		} else {
			fmt.Printf("OK ✅ (Produto: %s, Valor: %d %s)\n", p.Product.ID, p.UnitAmount, p.Currency)
		}
	}

	fmt.Println("================================================")
	fmt.Println("✅ CONCLUÍDO. Se viu ✅ nos preços, seu sistema está pronto para faturar.")
}
