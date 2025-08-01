import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import CircleEditor from "../src/CircleEditor";
import { IComponent } from "../src/entity/Component";
import useLocalStorage from "../src/utility";


const DUMMY_COMPONENTS: IComponent[] = [
    {
        type: 'heading',
        content: 'Heading...'
    },
    {
        type: 'text',
        content: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.'
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

    const [components, setComponents] = useLocalStorage<IComponent[]>("components", DUMMY_COMPONENTS);

    useEffect(() => {
        // console.log(components)
    }, [components]);

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
