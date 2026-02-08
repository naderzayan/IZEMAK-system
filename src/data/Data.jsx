import React, { useEffect, useState } from "react";

function ExampleComponent() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch("https://www.izemak.com/azimak/public/api/parties")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                console.log(response);
                return response.json();
            })
            .then((data) => setData(data))
            .catch((error) => console.error("Fetch error:", error));
    }, []);

    return (
        <div>
            <h1>Data from API:</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

export default ExampleComponent;