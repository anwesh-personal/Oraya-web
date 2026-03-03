# 01_AGENT_TEMPLATES.md

**Cloud Agent Distribution System**  
**Updated:** March 2026

Oraya uses a "Template -> Instance" model for distributing premium agents.

---

## The Concept

Instead of hardcoding every agent into the local Desktop app's source code, all specialized agents (like Axon, Cipher, Pulse) exist as **Templates** in the Supabase Cloud.

When a user logs in, the Desktop app downloads all templates they are entitled to (based on their subscription tier) and hydrates them into local SQLite instances. 

### Why do this?
1. **Dynamic Updates**: If a new VS Code integration strategy is discovered, Superadmins can update Pulse's template in Supabase. Every user gets the improved agent instantly without a Desktop app update.
2. **Access Control**: Enterprise agents (like Wraith for pentesting) are only sent to users paying for that tier.
3. **Specialization**: It prevents Ora from becoming a bloated "know it all" monolith.

---

## The 14 Cloud Specialists

As of March 2026, the global templates defined in our Supabase schema include:

*IDE & Coding*
- **Axon**: Cursor / Antigravity integration (Surgical code).
- **Cipher**: Claude Desktop integration (Analytical).
- **Pulse**: VS Code / Copilot integration (Terminal-first autonomy).
- **Drift**: Windsurf / Zed integration (Semantic indexing).
- **Lark**: Front-end & React/TypeScript components.
- **Forge**: Database architecture & migrations.

*Security & IT*
- **Rook**: Threat intelligence & security.
- **Vigil**: System monitoring & log analysis.
- **Wraith**: Penetration testing & exploits. (Enterprise Only)
- **Koda**: Local OS model orchestration.

*Domain Experts*
- **Thalas**: Deep web OSINT & research.
- **Muse**: UI/UX design & visual analysis.
- **Noor**: Multi-language translation & global logic.
- **Coen**: Scientific research & academic parsing.

---

## Managing Templates via Superadmin

The `superadmin/` section of the Oraya SaaS dashboard is where developers manage these templates. 

When editing an agent in the dashboard, you are editing the following tables:
- `agent_templates`: The base icon, name, and role.
- `agent_template_prompts`: specific sections of expertise.
- `agent_template_rules`: `must_do` or `must_not` guardrails.
- `agent_template_examples`: few-shot interactions to teach the agent tool usage.
