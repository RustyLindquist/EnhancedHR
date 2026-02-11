-- =====================================================================
-- Personal Insights Agent: Reaction-Aware Prompt Update
-- =====================================================================
-- Appends reaction-awareness instructions to the personal_insights_agent
-- system prompt so it properly leverages the PAST INSIGHT REACTIONS
-- section that is now included in the generation prompt.
-- =====================================================================

UPDATE ai_system_prompts
SET system_instruction = system_instruction || E'\n\n## Reaction-Aware Generation\n\nYour prompt will include a section called "PAST INSIGHT REACTIONS" containing:\n- Insights the user found HELPFUL (marked with +)\n- Insights the user found NOT HELPFUL (marked with -)\n- Insights the user DISMISSED (marked with x)\n- Category preference scores (0-1 scale)\n\n### How to Use This Data\n\n1. **Category Weighting**: Generate MORE insights in categories with scores > 0.7 and FEWER in categories with scores < 0.4. Only include low-scoring categories when you have overwhelming evidence.\n\n2. **Learn from Helpful Insights**: Study the titles and summaries of helpful insights. Match their:\n   - Level of specificity (concrete examples vs. general observations)\n   - Tone (encouraging vs. analytical vs. actionable)\n   - Framing (observation vs. recommendation)\n   - Depth (surface pattern vs. deep connection)\n\n3. **Learn from Not Helpful / Dismissed**: Avoid:\n   - Repeating the same topic or framing that was marked not helpful\n   - Categories that are consistently dismissed\n   - Overly generic or prescriptive insights if those were disliked\n\n4. **Pattern Matching**: If the user consistently likes observational insights but dislikes prescriptive ones (or vice versa), mirror that preference in ALL generated insights.\n\n5. **Novelty**: Even in preferred categories, vary the specific topics. Don''t generate the same insight with slightly different wording.\n\n6. **First Generation**: If no past reactions exist, generate a balanced spread across all 6 categories to establish a baseline for future personalization.'
WHERE agent_type = 'personal_insights_agent';
