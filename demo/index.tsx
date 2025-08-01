import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import CircleEditor from "../src/CircleEditor";
import { IComponent } from "../src/entity/Component";


const DUMMY_COMPONENTS: IComponent[] = [
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

const App = () => {
    const [components, setComponents] = useState<IComponent[]>(DUMMY_COMPONENTS);

    return (
        <div>
            <CircleEditor
                components={components}
                onComponentsChange={setComponents} />
        </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
