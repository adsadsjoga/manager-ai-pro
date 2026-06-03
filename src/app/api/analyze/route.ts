import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um especialista sênior em Facebook Ads com 10+ anos de experiência.

Analise as campanhas fornecidas e retorne um JSON com este formato exato:
{
  "health_score": número de 0 a 100,
  "summary": "resumo executivo em 2 frases",
  "alerts": ["alerta 1", "alerta 2"],
  "opportunities": ["oportunidade 1", "oportunidade 2"],
  "recommendations": [
    { "priority": "high|medium|low", "action": "ação específica", "campaign": "nome da campanha", "expected_impact": "impacto esperado" }
  ]
}

Benchmarks: ROAS bom > 2.5x, CTR bom > 1.5%, Frequência ideal < 3.5, CPM alto > R$50.
Seja direto e prático. Retorne APENAS o JSON, sem texto adicional.`

export async function POST(req: Request) {
  try {
    const { campaigns } = await req.json()

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ error: 'Nenhuma campanha fornecida' }, { status: 400 })
    }

    const campaignText = campaigns.map((c: any) => `
Campanha: ${c.name}
- Investimento: R$${c.spend}
- Receita: R$${c.revenue}
- ROAS: ${c.roas}x
- CTR: ${c.ctr}%
- CPC: R$${c.cpc}
- CPM: R$${c.cpm}
- Frequência: ${c.frequency}
- Leads: ${c.leads}
- Compras: ${c.purchases}
- Score de saúde atual: ${c.health}/100`).join('\n---\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Analise estas ${campaigns.length} campanhas da conta "Retro Mundial Ads":\n\n${campaignText}`
      }]
    })

    const raw = (message.content[0] as any).text
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { health_score: 50, summary: raw, alerts: [], opportunities: [], recommendations: [] }

    return NextResponse.json({ success: true, analysis })

  } catch (error: any) {
    console.error('AI Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
