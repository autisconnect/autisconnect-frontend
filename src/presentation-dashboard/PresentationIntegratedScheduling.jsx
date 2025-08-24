// src/presentation-dashboard/PresentationIntegratedScheduling.jsx
import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { FaCalendar, FaBell, FaUserFriends, FaSyncAlt, FaLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logohoriz.jpg';
import '../App.css';

function PresentationIntegratedScheduling() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBackToHome = () => navigate('/');
    const handleSignUp = () => navigate('/signup');

    return (
        <div className="scheduling-page">
        <Navbar bg="light" variant="light" expand="lg" fixed="top" className="mb-4 service-navbar">
            <Container>
            <Navbar.Brand>
                <img src={logohori} alt="AutisConnect Logo" className="d-inline-block align-top logo" />
            </Navbar.Brand>
            <div className="ms-auto">
                <Button variant="danger" onClick={handleBackToHome}
                style={{ backgroundColor: '#007bff', borderColor: '#007bff', boxShadow: '0 6px 8px rgba(107, 97, 97, 0.1)' }}>
                    Voltar
                </Button>
            </div>
            </Container>
        </Navbar>

        <div
            className="hero-section mb-5"
            style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxITEhUSEhAVFhUVFRUSFhUYGBUVFRUVFRYWFxcVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OFxAQGislHR0tLS0tLS0rKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rLS0tLi0tLS0tLS0tLf/AABEIALcBEwMBIgACEQEDEQH/xAAcAAAABwEBAAAAAAAAAAAAAAAAAQMEBQYHAgj/xABMEAACAQIDAwYJBwkIAQUBAAABAgADEQQSIQUxQQYTIlFhcQcyQlOBkZKhsRQjUnLBwtMXQ2KCk7LR0vAVM0RUY6Kz4VUWJIOU8Qj/xAAaAQACAwEBAAAAAAAAAAAAAAAAAQIDBAUG/8QAJhEAAgIBBAICAgMBAAAAAAAAAAECEQMEEiExE1EUQWFxIjKhI//aAAwDAQACEQMRAD8AyWCCCMiCCCCABwQQQAOGIQhwAOHChiAgxDhQxAQBDghiMACHBBAATqEIcABDgggAIIIAIACCKCkYtSw8kotibG6rJDBicnDxaitpqw46ZmzZOCXwzWjsY0CRjVbCRGLx2sszYotckcGolF0i1DHiS2Argyh4bGEiP8HtcowvM2mhGMjVqM7cTQ6dIRYU4w2Xjg6iSJadAw9iFQzjPCrtGrVbSLJId3hRp8ogkCZjkEEE5htBDEKHAAQ4UOAAEOX/AMFHIrD7R+U/KGqrzPM5ebZVvznOXzZlP0BNA/Its7zuK9un+HAKMBEMTffyLbO87ivbp/hwqfgY2cQDzuK1APj0/wAOAUYJDm+fkX2d53Fe3T/DnL+BnZ4t87idTbx6fUT5vsgKjBhDm9/kY2d53Fe3T/Dg/Izs/wA7ivbp/hwsKMFhgTdj4G9n5gOdxOoJ8enwK/6fbO/yM7P87ifbp/hwsKMHhzePyNbP87ifbp/hzhvA5s+4HO4nUHy6fC3+n2x2FGFQwJu/5G9n+dxPt0/w52vge2ePzuJ9un+HCwpmFpRjqjhptb+CfAqLipiN6jx6fEgfQ7Y4TwV4IfnMR7afySyMoIi4yZigw0VpUZtH5L8F5yv7SfyQfkuwXnMR7SfyS1ZYIreOZkHMiJNSsZstPwaYPzlfeR4ycD9SB/Bhgz+cr+0n8ksWogiqWnmzDsdV0tISsbz0FV8EWAbfVxPt0/w5F7e8E2Bo4avWSpiC1OjUqKGdCuZELC4CbriRyZoz4QseCeO5MxjCsRBXYmP0w2kUp4S8veBJGdZ3Jj7k1tIqcpl6w+KuJR8NgrayfwbkCT+iUSUr1YxqVYnXqmN0aBOzs1oI3dtYI6I7jOYIIJyDpAhwocADhiFDgBsX/wDPS3GOHWMOL/t5rXyap57q8nq69dZ5RwWPrUkPM16tLMwzc3UenmsNL5CL2ufXHC8o8cN2Pxf/ANiv/PEFnq3DIwFnbMeu1ok9FmRcr5dB28BPLq8rNoDdtDFftqp+LRxW5Y7RDMBj8QAGIA5xtwPfANx6XOHred9w017tdPh26LAGyZjdr623Xym9uyeYl5b7T/8AIV/bv8Y4ocutp9L/AN/V0W4vkNjcC+q9RMdBuPSeIpvqUYAkAa3IFr623dURalX0IqLpv0Gov1W327Z5zHhB2r/5Cp7NL+SKL4Rdrf59/YofhwoNx6NrB9LWzZD3Xul/tiQfEaDKu8a79COIuN32dt5gCeEjauUt8sJIZVB5qhuYOSP7v9FfVAPCftb/ADY/ZUP5IUOz0Bztfza+gg8e0jhO6DuWGdcpFx36Kb++3omBJ4UNq/5lT/8AFS+xY/wvhM2kQWNSmSLAfNrxvfd3CSjjcuiLyJG3c9UBN0uNbEacWAFteAXXtnJxdTzR07Sb92kyOn4Ssfa5al+z/wC5z+VDaH+h+zb7HlvxplT1EDY2fMgNrXZdP1xOqjsCLC4tr33AGvvmQ4bwmY59GTD7i3iVBqoLD851gRdPCZjfN4b2Kv4sPjTH54GojGNxpt7+zrEeTKk8JOL40qHs1B9+LL4ScTxoUf8AePti+PMfmgaTmIViN4zH3mIjHa6obaXPDW+v9GUA+Easv+HpnS+9uOv2wDwl1f8AKp7bfwh8efoPPD2X44/XxDx79CBu7dYy5T1M2AxRsRfD19/1GlOPhQcf4Nf2pH3I3xfhAqYmlUw4wQUVab0s4qk5cykXy82L2vuvJLBNNOv9ISzwaaszMkWhU6msUxuDdBciRyvrOlJquDlQtSplgwzXkjT3SIwDSWU6SBqOKhgpzmpOOctGIFRNYImcRDgLgzyCCCcc6gYggEAgAcOFDgAuPE/X+7ExFqbkJpbx+IU8O0QDEH6KH9RR8AICETFcT47fWb4mHzw82n+/7GiuIqDO3za+M3F+s/pQAbRahuf6v3lh84vmx6Gf7SYtRanZug3i/TH0l/RjEc7Qpqr2QEKUouATmIz0abm7WF9WPAdwiAiuZOKueHjjcNB5HVOr0+px6VP3RAYSeI1/p0/hUjvGYVVcKoIOXpoWDmm+ZgULBQL5QpItoSQdQQOKWQISrOCHpkHKuhAqW8qPlYVGzO5LHeRTprfjchWAJ1375PHHcyE3SGYoxalor96fekl8nT6R9K/wJiFfDjK9nXenB/0v0ZujBIxZJscYqgERGDMVcNYsuW+UgZgLnoknS9jodIxVotiKwcAZqSAFmsgqgFmyhjYg28VdBYC2ghYfDg+WnrI+IEsIdjvZqdI/Vf8AcaPxgyKfO3FswUDyjcN0rfRuhHeD1TnZ+HsTqviv5Q+g0dviHNPmyaZF0sb0cwCBrDNv8rr+Ji/RNIY5oojxNqLdntL/ABh0MNUY5VRmJ4AE/CN0CskloZrnMqhVQkte2tgBoCY0cSYobMxVO55vEKCqa0rE6AXDKGF/s6jInF5izNzbLdmbLY9EEk23cN0hGab4ZOUWu0Ma7Sx7BRbCw/q0qtdo92PtTIwB7fgZKcXKPBXCajLkmds0QaZvM9PjHvli2vtwuuVZW0GsjCLiuRZJxlJUTmzzJdTpIHCPaSi4jSWIDuq8Z1akOtVjV3kiDYC5gid4IESqQQQTjHYDEMQhDEADEOEIcAJDZmFFSys1lu7sbquiU2a2ZtBewFzuvfXdGuIpZHZDfosy62v0SRrYkX04E95i2FrZFza3zEXsrCxQqwKsCGBBIsdNZzWdWYszuWYlmORdSTcnxuswEIGPquFBFWpzgujG6ENcguFFmtlvqTa97K3VG2RPpkd62+BMdYgjpoKiWNTOdKlyVzADxToMze0eyADKLUDo/wBQ/vLAtAHc6esj4gRWhhzZ9U8T6afSX9KMKOcXhHpMFcAG19GVtzMpF1JFwysCOBBiQkttrENXZXCk2UrvpkgZ2YIBT4LmsDa549Qjzhanm39lv4QAVwi3Rvrp8Kkk6FK28WMQ2WjLqVtapSbpKbaZzqOIk9tR1JSzFiEIYl+cNy7sBnyrfRhw0vbhNWBFGVjNjpaJ1E6Dd6/enNR9Z3znQY6GxQ2O479/ZNtGFshqjax5gnkmtMNWqZKaNevTDjIpVaBBzEC1kS+9ha3R1Eh8Na5sdL6Hs4SKdsFwTuFqWJ+q/wC40S52JYd9T9Sp+40dYilSDpbOEZEc+Kz9Ia23Df6u3iyV2JKCSABcnQDtl42VgUw9O58ci7H7B2SL5PbKC1HqsOijulO/EqxGY+qc7c2pqQD2Tma3Pb2Lo62g09Le+30TGA5Q5a4F9CBf1S2YnCYTFL84iknyho3rGszAYUCnzxY3BpC1tMrKdb+jdLdsajVahTdQwuB44CE6bwMxNuHDh6MGOcovg6WTHGS5IzlHyKr0gXw1R6ib8uY5x3a9KUyhiHD5WZ+IIJbqOhBmz4B6q6Nb13jfa/J6hiDmelZ9bOtg2o49c6WHWUqkjkajQ27gzDK0bAay8ba8HuJp3alaqo4bn9W4ym4nDujZXpsp6mUj4zcssJ/1ZzHgnjf8kK02inOmN6RikkMVzzh2nJM5cyRBh5oInBFYivCCAQTjnZDEMQhAIAdCGIQhiADujQZkOVScuZ2twVVuzHqAETrYdlClhYMLjUHgDrY6GzKbGxswPERfCGyk6fnF1IX+8pMlxfqzXimIGanTRBfIXY60tC4p3AKG7dJCbtqAQOEBDAxbEeO/1m+JhHC1PNv7J/hJF8UqlFqhiKdbEPlyi4zCmUNjYMM6m4J1AtppACMEXo7m+r95YptV1avWZGzK1WowNrXBcm9rnridA2zG1+ju116S6aQGJzpEvwk62ERmxCpR8q6NlZqdNVpVHK5ucBQmwsSG8XXjI/CYeShHcyMnSH+ywwQ2YjpJuJHB5LKz28dvWYNkYVTZWJAL0wSACRfONASPjJM4Ac0z3NwXAAy7ky3JBOY+NwGltZvglHgyybZWsZiWB337wp+IiKY082+i718hO3sh7TkehujAbyyAbhvJ4ndL26RjpuRzVxQO+mh7ekPgRHGFxK+bX1v/ADRv/ZlQ1TRzUxUDKgU1EGZm3BGJs28bjxEQwzyqOROVFksbSssGHrJm8Q+LU8r/AE261jvZtIV6iU+nuAvmU2Vf1RIzBC5/Uqf8bSz8i6Ni9Qg7go069Se6wEeeeyDkh6bH5Mii+iYx+PVMwLEAdQHG/C43mVeqUNyXN77so/mjflPj87mx0+yTfJbZFlGIrjTfTQ8f02HwHp6p558s9PGoonNmYHLSVqpFiqMFINxlBsSLdp0iW2OUgUjKVuLC4L8BbytB7o023tobr8B8JTMZtC7aRkW+bNi2HtkuoLFesdJerv67yeo7QQ8R7j8Jh+ztslB42ktWxcZXrWKU2I+lay+0dDGsjQPCpcmlHEIdxiZ5tt4U94BlYoYHEsAOcRRx3sfVa3vk3gNnZFtnLHeSbXvLFJv6KpQjH7GPKTknh8TTbLTVKoHRdQAbjcGtvExivRZGZGFmUlSOojQz0ImkqXLLkcMV87RyrW430WoO3qPbNmnz7eJdGDU4N63R7MhaJkxztDCvSdqdRSrqbFTw/iO2M7zpJ2jlNU+Tu8ETzQRAQcEEE5J1wQxChiAHQhwhDEAF7/N/r/ZE5KbDNrm66XORjTUVfFHNZqmgBvrxyhgN8kcPsCpVpJZFAtRysAocnmzz2cjpH5y3jbtLaRNpdjUW+itWjqtXcOwDsBmbcSOJlup8hSRqTHj8ggQzXbNnPEZTc7gtr3G+97cLSHliWeCZRBiX4sW+t0x6mvHGGZjm6K+L9BB5S8QLy34jkbzZsDmFgb2tvAP2zrC7CtcWtpbXvE044KauyjJuh2it4al/prqLG2cX77NJHD0kG9D6G/iDJ07CYEgWNgCNRqCLjLexPdvjGtSyzXCCRmlJsVwrqFJGYWZCNQdbN2CdvjbKVzGxzalFuMwAbKc2lwADI8vZW+svweNcRiNJZRW5DXamU/nF9Ie/uUyONG9N7Oh1Tjl+l9K04xlW5iKH5t+9PvSOSXFFcFzY5fEsaz1gozFCqBaiEq7IKeY2N9FLEW8rLG+Gw1Tzb6fot/CNKlBvon1GcU+jvFrdekxxltkbZQ3RNB5PbBLJztV+bUrUAFrsRlYE24DfLjRxlOlQDiqajPTsGZxTZsoC25w+IdN5+jbjEOTGwMTicPQJZqNNaIS7BgxOUi6poba3ubdkWx3JWjQpstXG1SDr0smUHrAIJ98oy5sk276N+HDgxRjX9vsrdPZKVcQ+IqWNLOzAcHYnNa+4qL6m+sV5Qbe0NtBuiu18YtKgqIVZQACbKM3EnQaXOsoOO2rnbWmhA+uPg1plSs0TlRLVsSHpVCVuy8wQ9zuYWK5d3Df8OMl/YVOpRaqmRKdNkXnAxZmDU2J5xCejUDBdAFHSOh0lXbEoWAIZVKU75XsCAotcMGvLk21efp01YMlGkAKaXBzECwdhYX6hcybVFKd8sjdhbPFH51+la+TMBp25euXrYPKZHsruBw7e6w+Mz/a+0E4O3Z0Rb09KQ2zyOdVhWB3m1nB8U7ujb3yKT7J710bnTxqixFQMDx6xw9O/3R9S2opG+ZFg9sNYXMfU9sncCSTuA1J7gN8j5Gi3xJqzT32kLeMIMPtRSbXmc08NtKubU8O6KfLq/NgduU9I+qWjY3J2pRF3qF24nh6OySUpP6IOEV9kH4W9m60sUo0I5pz270J/3D1TNiZt/K/D58DXW1yKZYDfqnSHwmG3nW0k90K9HD1uPbktfZ1eCcEwTSZKImCAi0E5R1wQxCjrA4NqjZVEQJWcYeiznKouZbtjcjy1jUv3Sd5L8l1pjMw1MteFUA2AlE8jfRrxYV3IhdlcllQaC2t/dLZgtmqo1A9QPvjzB0Qd/wD+dsZbUx60wNdSbW9GvxHrkGvZfGlwhzUyjgP67p2tjpbS/wDWsiaFUvrJamhAv22kaJArYZTvH9CMH2et72uOq1ri4NtJxitqANlvrHeHrBh6JZCbi+CM8akuSLrUxdjc3IsDoSNLHgAOA03CQONwF+APcQfcDLVi6OkgMZppOpgyb0cvUYdjK42BYWGqfOU+mQbJ43Sv2b/RGqVy2IIa2WyK96lGoxQC2d3Nww0BfLw6rXEti06LW+kvwaVPalVx5badpI9U0tWYXwyCqmK4AnK1lLHNSGVfGN2Isuh6R0A0O+FUxLcQp/UTXv6MPDYwoGdUVWV6bhgXBBBJB0bTXqmTLI0Ykh/htiLXxORM2QBDWyHnubdzlyI4Fn6RHS1AAfU5dWPJ3az4WstbmkqFNyVFzKrdYB3MNfXC/tENVWsaZV1KsChpqLqbg5ebtfT0zkCjvvUv+kFb0npAmZ2zQlXTNJwvhDxVYtdkFkZgLHUZCwt7pAbTbFY3xanOXKqQDlCO9sqMGsLm++5HRbXSQGBtnuKo8WpvVgf7t/ogj1GWvZ+16YpCmjlf7ptDTFmQDOylrXZmGbpDgBewFlPG6tE8eSO6nwVWvjXVeaZlYAaFXSoLfWRiPReRV5Obaw7OylM1Q5LM+VQXYMxBIRm3KVW5NzlkWMIwIzKQL8QR8ZSqRdK2ySwWDDFWbRQiW7eiI72ntEKLCSFHEstJ2QMyhFQ0VtZiaRu9Ub+bUG+43PVqRHYqmr4NSinShzzuaSZC/wAqNMqK/jipYoMpNiulrkNCrE5UV+pVLHWL7Oa1RfT+6Y0zdUsXJ3ZtmFSp2kD0GD4EuR5ybwCHp4gErwUEqPSRqZp/J7E4TL8zTVDxyqAfSeMyPau1NMqmwjbZHKGpQcMrG19R1ytRfZf5F0zfae0VDWJjk4lSJi1fliztfdwj2hy1IFryW5+hUvZrS2OoPomG8sdj/JcVUpr4h+cp9iNew9BBHolnwPLLMbXjbl63PChWA4Mh9xH3pp0mT/pt9mXXY7xbvRRIcXNI9UE6lHF3DTHYbyhI+SuEr36J9ERxmEsbjdOWdYYqL6TReSWxwqqSNTqZQ8NT6a94mvbFpdAd0qyGjAldkq9cImkY7OxV2veMuUVUqkYbFDsuYSimbVRoVDF5UJmc7d20KmKWnc2Uk6EW17LfbLNtLFFMOSeCn4TIMLiyaxc7yTJJWivJJRaXs2zZLrYa+7/uLcoNrrRphr+Kb7wL9utte8yt8mcWzWvutIXwm445VS+8xRLJ0o2NMPtZ6tc1NSpy2tl4KATlRmCi4OgNhul/2Q7EbracfRMW2PVHOLfrm47AAyAiOSpixPdCyZWlc2PUATa9xxOm7v7JS9ujKby14jFBRKVym2ktjoD6/sM0aZvfwZ9TFbHYyFQFTc2GZbnfYWbW3GQ+2dlnOVzhdaarnDKWaquZEsoOU2vvNh1w02oo8m+obeCNL6Wtu1641xW2ELarcKabIouqq1LNluSzMV6TXG830IsJ1JOji98FVq74EHzdTvT70VqUrknnFJNyb5l19IAiuHw7WNjY5qZupV2FibsApuSN+kwzdmqCGlSiyEq6MrDerAqwvrqDqIJO1jzdbCk5CUCK5sz0v752zE1hqSHzEEWU9W4Q2KILvbdma1uq5lRYKYI9I/Uq/wDG86QxLB+MfqVf+J4pRM0YJclGaNoUBMmNqYB6CocxVioJAJB11O71eiNsNSBj7b71K2U2vYAG3ZJavG2k4olociW5Tf6IbauIfMLtm6CaMA48UcGuI0OIYCxVSL5suUKL2tc5La2k42zCz5306KWX9Ub4zxeDs0xSjKPaNiqXTEtnhAcz0l06i/3iZJ/2mhYABho1ukDrlPDKJFFrAiNcD/eL6f3TI1bJN0hvUqEx1s7Ac4bFrD1+6NE4SV2WbEd8HwhQVvkVx2wzTFw+b0WkTUW0tuIqaSuYw6mKLJTil0HstGLdHhqe6aZsJg1AZ1zAEadXCZrsetle9+ya3yRZSV003Wi3bZpocYqUGmdph8ORew90EslTZNAkkoIJs+X+DN8X8nnCSOGr5hY75HQI1jeVWJjpkysD23EvWxNvBU1lOpOHEdYfqB+yRmrLMMtrJrlNygDrlEneS206YogEjQSi4mnxIvHWCZQAL290ht4NCyXIs3LLbS80VU7xaZxhNGHfLLjqNxvv75FCkL7pKK4K80m5Jmjcn8VTFIHjaUblxjOdrAA6LH2CqECwbhI3HYfpEkayMVyW5Z3GiEwykEETXOSm1DzQBOomb0aAln2TiMq7opr7DBKk0WHbW02vZZUsfmY3MlK+OXrjCti1luB0yvU/yXJEthmiFbBmTIrgxN2HXNm5swbUQJwJnDYQydYCJ5BK3EdkMlJ18UkdxI+E6JqcTf6wDfvAyWyrBZeyLYPcRSkjXm0vYjcV0YFTopA3Ew0C/Qb0NYe9SffJXKnWIDSTrjjGiLdiWGdB5TD9UH35vsj1Kg84vd0h9lo1amnXEmsOM0LI0UvGiVqubi1j0VGjKTew4A3jLFoTqVIPWQRG1x1zumxG4kdxtK8rWRUyzFeN2iNrpwiWDT5xfT+6ZMu7He1/rWb968aOrLrkQnWxta1xbybA7+MxuDibFNSIRRuktg11HdI+olpK4QCwMrZOA9xTaSAxTayZxFS4kJiYojmc4drETUORuM0HZaZUh1l15M4/IBc7zI5PY8L5o2MYgQSp09sC2+CV7zRtMVvBODcQw01nOFaFUqbyWp1MwBAB+MhLxzg8TlPZGHQ9errYFl/Ra1veftjuhXOmZRYaaWbT6pYfGEaecXnCYQrqpK9271SLRYpDirVpbwSD2DKfUWjPMRu1+tYe8GL1He2VxmXuHwjemCCcmZf4dUSJtjzD1kAu4I7QC3vVr+6J1qqMbhzf1j1E3iuHeqvkG3YCL94nOIoZ/wA2fZiH9CFOqc2qXHYOHcT9seriQNBUyjtFvibe+N6WzX3gEHtF/jHFPCVBvoA9osPjG0JOgqtVrHTP1EC3vBjCpV01Vl9/wkidkOdeZA7rKfWImdgVzuX1kSyCKsjsjkxNho2vd/RifyxweElk5M1zvVfX/wBRUckqtvJH6x+FpbZTRCNjT1ictjO/v/6k23JB+NamO8wv/TFIeNi6PrB+2K2FEGcR+l67iGHPA37iD8JNf2Bhhvxqfqox+BMH9mYMf4pz3U2+9C2OiG5ww+dPXJj5Pg18vEHuFMD3mJOuEG5Kx73RfgpjUhbSMNUwucMeviMKPzJ9Na/wURu+OocKVP2qp+DQ3htEucMHOHrnLbSp8EX0Bj+8Yi2014KPYT7ZF5BqKHHyg9cI49hxjU7UPBbehR8BODtSp1n2mkXNkqQtUrM/kX7gYpS5wC2VvUYxbG1Dvb4/xnHOseMg+SSddEnUrsBqIxareIHMeuBUbqioe5sWBjuhjCp0O6R5DDeIA8TjY1Ki2Uts6DWCVbnYJX4kWeZjgiJtTggl5QcHSGGggiAfYPEkaXjhdospsdYIIxAxO0CIthNqgbxBBGOx8duWGiRClyhYnxB64IIxCx28/BR75wdv1eseqCCFgcNt+r5z1AfwiT7fqedb4fCCCKxDept1uNSof1mjd9sX35j3kmFBFbJUInavUs5O1W4AQoIWFHDbSqHqhHE1T5XwhQQALLVPlH1wfJHO8++CCAg/kLQxgDDgjoLB8gMP5B2w4IqGAYGKLgIII6ELJgY5p7NHVCgjoB5S2UJIYPZKkgWEEEaESh2NT3ZRK5yg5PhRmTSCCDQyqMCNIIIJWM//2Q==`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#343a40', // Fallback
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '20px',
            borderRadius: '10px',
            }}
        >
            <div>
            <h1 className="display-4 fw-bold mb-3">Agendamento Integrado AutisConnect</h1>
            <p className="lead mb-4" style={{ color: 'white' }}>
                Conecte famílias, profissionais e serviços com um sistema de agendamento simplificado, incluindo lembretes e confirmações automáticas.
            </p>
            </div>
        </div>

        <Container fluid className="px-md-5">
            <Row className="mb-5">
            <Col>
                <h2 className="text-center mb-4">Como o Agendamento Integrado Funciona</h2>
                <p className="text-center text-muted mb-5">
                Nossa plataforma facilita o gerenciamento de consultas e serviços, conectando todos os envolvidos e garantindo organização e praticidade.
                </p>
            </Col>
            </Row>

            <Row className="mb-5">
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaCalendar className="text-primary me-3" size={30} />
                    <h4>Agendamento Fácil</h4>
                    </div>
                    <p className="feature-paragraph">
                    Marque consultas e serviços em poucos cliques, com uma interface intuitiva para pais, profissionais e prestadores de serviços.
                    </p>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbPHXfKSq7OgT7AhC0XllkYqllJ7w1CQJZfA&s"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Agendamento fácil"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaBell className="text-success me-3" size={30} />
                    <h4>Lembretes Automáticos</h4>
                    </div>
                    <p className="feature-paragraph">
                    Receba notificações por e-mail ou SMS para não esquecer consultas, com confirmações automáticas para maior organização.
                    </p>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGr8SMhByW1sKQ4PRd743UTkWrqQ1mELdldw&s"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Lembretes automáticos"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaUserFriends className="text-warning me-3" size={30} />
                    <h4>Integração com Profissionais</h4>
                    </div>
                    <p className="feature-paragraph">
                    Conecte-se diretamente com médicos, terapeutas e outros profissionais, visualizando agendas e marcando consultas em tempo real.
                    </p>
                    <Image
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Integração com profissionais"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaSyncAlt className="text-info me-3" size={30} />
                    <h4>Sincronização de Agendas</h4>
                    </div>
                    <p className="feature-paragraph">
                    Sincronize agendas entre famílias e prestadores de serviços, evitando conflitos e otimizando o tempo de todos.
                    </p>
                    <Image
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Sincronização de agendas"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaLightbulb className="text-primary me-3" size={30} />
                    <h4>Gestão Inteligente</h4>
                    </div>
                    <p className="feature-paragraph">
                    Gerencie compromissos com insights sobre horários mais convenientes e lembretes personalizados para cada usuário.
                    </p>
                    <Image
                    src="data:image/jpeg;base64,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"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Gestão inteligente"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            </Row>

            <Row className="mb-5 text-center">
            <Col>
                <h3>Experimente o Agendamento Integrado</h3>
                <p className="text-muted mb-4">
                Simplifique sua rotina com nosso sistema de agendamento. Cadastre-se agora!
                </p>
                <Button variant="primary" size="lg" onClick={handleSignUp}>
                Comece Agora
                </Button>
            </Col>
            </Row>
        </Container>

            {/* Footer */}
                <footer className="bg-light py-4 mt-5">
                    <Container>
                        <Row>
                            <Col className="text-center">
                                <p className="mb-0 text-muted">© 2025 Autisconnect. Todos os direitos reservados.</p>
                            </Col>
                        </Row>
                    </Container>
                </footer>
        </div>
    );
}

export default PresentationIntegratedScheduling;