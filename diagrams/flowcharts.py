import os
import json
import urllib.request
from openai import OpenAI

# very verry secure OPEN AI key
with open("../secrets.json", "r") as f:
    secrets = json.load(f)
os.environ["OPENAI_API_KEY"] = secrets["OPENAI_API_KEY"]

client = OpenAI()

def generate_meeting_flowchart(meeting_summary, participant_names):
    """Generate a flowchart from the meeting summary using OpenAI"""

    prompt = f"""
    Based on the following meeting summary, create a detailed Mermaid flowchart that shows:
    1. The main discussion flow and topics
    2. Key decisions and action items
    3. Participants and their contributions (identify which parts belong to which participant)
    4. Timeline progression of the meeting
    5. Any risks or concerns mentioned

    There are only 2 participants: {', '.join(participant_names)}.

    Meeting Summary:
    {meeting_summary}

    Please generate a Mermaid flowchart syntax that can be directly used to render the diagram.
    Use different shapes for different types of nodes (decisions, processes, participants, etc.).
    Make it comprehensive but readable.

    Return only the Mermaid syntax, no additional text or explanations.
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a flowchart generation expert. Create detailed, well-structured Mermaid flowcharts from meeting summaries."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.7
    )

    flowchart = response.choices[0].message.content.strip()
    return flowchart

def render_mermaid_to_svg(mermaid_code, output_file="meeting_flowchart.svg"):
    """Render Mermaid syntax to SVG using Kroki API"""
    import base64

    # Encode the mermaid code to base64
    mermaid_bytes = mermaid_code.encode('utf-8')
    encoded_mermaid = base64.urlsafe_b64encode(mermaid_bytes).decode('utf-8')

    # Use the correct Kroki URL format
    url = f"https://kroki.io/mermaid/svg/{encoded_mermaid}"

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            svg_content = response.read().decode('utf-8')

        with open(output_file, 'w') as f:
            f.write(svg_content)

        print(f"\nSVG diagram saved to '{output_file}'")
    except urllib.error.HTTPError as e:
        print(f"Error rendering SVG: {e}")
        print("Falling back to saving Mermaid code as text file...")

        # Fallback: save the mermaid code to a text file
        text_file = output_file.replace('.svg', '.mermaid')
        with open(text_file, 'w') as f:
            f.write(mermaid_code)
        print(f"Mermaid code saved to '{text_file}'")
        print("You can copy this code to https://mermaid.live to render the diagram manually.")

participant_names = ["Alex (Project Manager)", "Sarah (Lead Developer)"]

meeting_summary_parts = [
    """0-10s: Alex opens the meeting by greeting Sarah and stating the goal: to improve the login process based on user feedback about slow times and confusing resets.""",
    """10-20s: Sarah agrees and suggests simplifying the steps, like adding a "remember me" option without extra complications.""",
    """20-30s: Alex asks about priorities, mentioning integrating social media logins like Google or Apple.""",
    """30-40s: Sarah prioritizes that and better error messages, estimating it could take 5-7 days to develop.""",
    """40-50s: Alex brings up potential risks, such as changes from third-party providers affecting the social logins.""",
    """50-60s: Sarah notes they'll monitor those updates closely and suggests a mid-week check-in to track progress.""",
    """60-70s: Alex assigns action items: Sarah to start coding the "remember me" feature soon, and himself to check API docs.""",
    """70-80s: Sarah confirms she's on it and asks if the design needs any tweaks for mobile.""",
    """80-90s: Alex says the current wireframes look good and user-friendly, no major changes needed.""",
    """90-100s: Sarah wraps up by saying the plan feels solid and they're aligned.""",
    """100-110s: Alex agrees, schedules the next check-in, and ends the call positively.""",
]

# Generate and display the flowchart
if __name__ == "__main__":
    meeting_summary = "\n".join(meeting_summary_parts)
    print("Generating flowchart from meeting summary...")
    flowchart_code = generate_meeting_flowchart(meeting_summary, participant_names)
    print("\nGenerated Mermaid Flowchart:")
    print("=" * 50)
    print(flowchart_code)
    print("=" * 50)

    # Save to file
    with open("meeting_flowchart.md", "w") as f:
        f.write("# Meeting Flowchart\n\n")
        f.write("```mermaid\n")
        f.write(flowchart_code)
        f.write("\n```\n")

    print("\nFlowchart saved to 'meeting_flowchart.md'")

    # Render to SVG as a separate step
    render_mermaid_to_svg(flowchart_code)
