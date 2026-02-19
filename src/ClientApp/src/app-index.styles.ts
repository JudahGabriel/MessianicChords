import { css } from "lit";
import { tabletsAndSmaller } from "./script/common/breakpoints";

export const indexStyles = css`
    main {
        padding: 16px;
        margin-bottom: 50px; /** needed to give some spacing between main content and the fixed footer */

        @media print {
            padding: 0;
        }
    }

    ${tabletsAndSmaller()} {
        main {
            padding: 0 0 16px 0;
            margin-top: 30px;
        }
    }

    #routerOutlet {
        position: relative; /* relative so that transitioned in/out pages won't cause scrollbar */
    }

    #routerOutlet > * {
        width: 100% !important;
    }

    #routerOutlet > .entering {
        position: fixed;
        animation: 160ms fadeIn linear;
    }

    #routerOutlet > .leaving {
        position: fixed;
        animation: 160ms fadeOut ease-in-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0.2;
        }

        to {
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }

        to {
            opacity: 0;
        }
    }
`;