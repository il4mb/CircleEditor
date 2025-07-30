import React from "react";
import ReactDOM from "react-dom/client";
import CircleEditor from "../src/CircleEditor";


const DUMMY_COMPONENTS: any[] = [
    {
        type: 'heading',
        content: 'Heading...'
    },
    {
        type: 'text',
        content: 'Hallo World'
    },
    {
        tagName: 'div',
        components: [
            {
                type: 'text',
                content: 'hallo world'
            },
            {
                type: 'text',
                content: 'hallo world'
            }
        ]
    }
]

const App = () => (
    <div>
        <CircleEditor components={DUMMY_COMPONENTS}/>
    </div>
)

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
